import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { 
  shuffleArray, 
  calculateEliminator, 
  reshuffleRemainingPlayers,
  GamePlayer,
  GameElimination 
} from "./gameEngine";

export const getCurrentSet = query({
  args: { heatId: v.id("heats") },
  handler: async (ctx, args) => {
    const set = await ctx.db
      .query("heatSets")
      .withIndex("by_heat", (q) => q.eq("heatId", args.heatId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!set) {
      return null;
    }

    // Get all eliminations for this set (including reverted ones for proper order calculation)
    const allEliminations = await ctx.db
      .query("heatEliminations")
      .withIndex("by_set", (q) => q.eq("setId", set._id))
      .collect();

    // Get only non-reverted eliminations
    const activeEliminations = allEliminations.filter(e => !e.isReverted);

    // Get eliminated player IDs
    const eliminatedPlayerIds = activeEliminations.map(e => e.eliminatedPlayerId);

    // Get current player order (this should be the shuffled order for the current round)
    const currentPlayerOrder = set.currentPlayerOrder || set.playerOrder;

    // Filter out eliminated players from the current player order
    const activePlayers = await Promise.all(
      currentPlayerOrder
        .filter(playerId => !eliminatedPlayerIds.includes(playerId))
        .map(async (playerId) => {
          const player = await ctx.db.get(playerId);
          return player;
        })
    );

    // The current server is always the first player in the current order
    const currentServerId = activePlayers.length > 0 ? activePlayers[0]?._id : set.serverId;

    return {
      ...set,
      serverId: currentServerId,
      players: activePlayers,
      eliminations: allEliminations,
    };
  },
});

export const startNewSet = mutation({
  args: { heatId: v.id("heats") },
  handler: async (ctx, args) => {
    const heat = await ctx.db.get(args.heatId);
    if (!heat) {
      throw new Error("Heat not found");
    }

    const league = await ctx.db.get(heat.leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    // Check if heat has reached the maximum number of sets
    if (heat.setsCompleted >= league.setsPerHeat) {
      throw new Error("Heat has already completed all sets");
    }

    if (heat.playerIds.length < 2) {
      throw new Error("Need at least 2 players to start a set");
    }

    // Get the last set to check who served
    const lastSet = await ctx.db
      .query("heatSets")
      .withIndex("by_heat", (q) => q.eq("heatId", args.heatId))
      .order("desc")
      .first();

    // Shuffle all players for new order
    let shuffledPlayers = shuffleArray(heat.playerIds);
    
    // Ensure the first player (server) is not the same as the last set's server
    if (lastSet && shuffledPlayers[0] === lastSet.serverId && shuffledPlayers.length > 1) {
      // Keep shuffling until we get a different server
      let attempts = 0;
      while (shuffledPlayers[0] === lastSet.serverId && attempts < 10) {
        shuffledPlayers = shuffleArray(heat.playerIds);
        attempts++;
      }
      // If still the same after 10 attempts, just swap the first two players
      if (shuffledPlayers[0] === lastSet.serverId && shuffledPlayers.length > 1) {
        [shuffledPlayers[0], shuffledPlayers[1]] = [shuffledPlayers[1], shuffledPlayers[0]];
      }
    }
    
    // First player in shuffled array becomes the server
    const serverId = shuffledPlayers[0];

    const setNumber = lastSet ? lastSet.setNumber + 1 : 1;

    const setId = await ctx.db.insert("heatSets", {
      heatId: args.heatId,
      setNumber,
      playerOrder: heat.playerIds, // Keep original order for reference
      currentPlayerOrder: shuffledPlayers, // Current shuffled order
      serverId,
      status: "active",
    });

    // Update heat status
    await ctx.db.patch(args.heatId, { status: "active" });

    return setId;
  },
});

export const eliminatePlayer = mutation({
  args: {
    heatId: v.id("heats"),
    setId: v.id("heatSets"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const set = await ctx.db.get(args.setId);
    if (!set) {
      throw new Error("Set not found");
    }

    // Get current active eliminations
    const currentEliminations = await ctx.db
      .query("heatEliminations")
      .withIndex("by_set", (q) => q.eq("setId", args.setId))
      .filter((q) => q.eq(q.field("isReverted"), false))
      .collect();

    const eliminatedPlayerIds = currentEliminations.map(e => e.eliminatedPlayerId);
    
    // Check if player is already eliminated
    if (eliminatedPlayerIds.includes(args.playerId)) {
      throw new Error("Player is already eliminated");
    }

    // Get current player order
    const currentPlayerOrder = set.currentPlayerOrder || set.playerOrder;
    
    // Use shared eliminator calculation logic
    const eliminatorId = calculateEliminator(args.playerId, currentPlayerOrder, eliminatedPlayerIds);

    // Record the elimination
    await ctx.db.insert("heatEliminations", {
      heatId: args.heatId,
      setId: args.setId,
      eliminatedPlayerId: args.playerId,
      eliminatorPlayerId: eliminatorId,
      eliminationOrder: currentEliminations.length + 1,
      isReverted: false,
    });

    // Update elimination count for the ELIMINATOR (not the eliminated player)
    const heat = await ctx.db.get(args.heatId);
    if (heat) {
      const eliminatorParticipant = await ctx.db
        .query("leagueParticipants")
        .withIndex("by_league", (q) => q.eq("leagueId", heat.leagueId))
        .filter((q) => q.eq(q.field("playerId"), eliminatorId))
        .first();

      if (eliminatorParticipant) {
        await ctx.db.patch(eliminatorParticipant._id, {
          totalEliminations: eliminatorParticipant.totalEliminations + 1,
        });
      }
    }

    // Calculate remaining players after this elimination
    const newEliminatedIds = [...eliminatedPlayerIds, args.playerId];
    const remainingPlayerIds = currentPlayerOrder.filter(id => !newEliminatedIds.includes(id));
    
    // Check if this is the last elimination (only one player left)
    if (remainingPlayerIds.length === 1) {
      const winnerId = remainingPlayerIds[0];
      
      // Complete the set
      await ctx.db.patch(args.setId, {
        status: "completed",
        winner: winnerId,
      });

      // Update league participant stats
      const heat = await ctx.db.get(args.heatId);
      if (heat) {
        // Award point to winner
        const winnerParticipant = await ctx.db
          .query("leagueParticipants")
          .withIndex("by_league", (q) => q.eq("leagueId", heat.leagueId))
          .filter((q) => q.eq(q.field("playerId"), winnerId))
          .first();

        if (winnerParticipant) {
          await ctx.db.patch(winnerParticipant._id, {
            totalPoints: winnerParticipant.totalPoints + 1,
          });
        }

        // Check if heat is complete
        const league = await ctx.db.get(heat.leagueId);
        if (league) {
          const newSetsCompleted = heat.setsCompleted + 1;
          await ctx.db.patch(args.heatId, {
            setsCompleted: newSetsCompleted,
          });

          if (newSetsCompleted >= league.setsPerHeat) {
            await ctx.db.patch(args.heatId, {
              status: "completed",
            });

            // Update games played for all participants in this heat
            for (const playerId of heat.playerIds) {
              const participant = await ctx.db
                .query("leagueParticipants")
                .withIndex("by_league", (q) => q.eq("leagueId", heat.leagueId))
                .filter((q) => q.eq(q.field("playerId"), playerId))
                .first();

              if (participant) {
                await ctx.db.patch(participant._id, {
                  gamesPlayed: participant.gamesPlayed + 1,
                });
              }
            }
          }
        }
      }
    } else if (remainingPlayerIds.length > 1) {
      // Use shared reshuffle logic
      const currentServerId = currentPlayerOrder.find(id => !newEliminatedIds.includes(id));
      const newPlayerOrder = reshuffleRemainingPlayers(remainingPlayerIds, currentServerId);
      
      // Update the set with the new player order
      await ctx.db.patch(args.setId, {
        currentPlayerOrder: newPlayerOrder,
        serverId: newPlayerOrder[0],
      });
    }
  },
});

export const revertLastElimination = mutation({
  args: { setId: v.id("heatSets") },
  handler: async (ctx, args) => {
    const lastElimination = await ctx.db
      .query("heatEliminations")
      .withIndex("by_set", (q) => q.eq("setId", args.setId))
      .filter((q) => q.eq(q.field("isReverted"), false))
      .order("desc")
      .first();

    if (!lastElimination) {
      throw new Error("No elimination to revert");
    }

    // Mark elimination as reverted
    await ctx.db.patch(lastElimination._id, {
      isReverted: true,
    });

    const set = await ctx.db.get(args.setId);
    if (!set) {
      throw new Error("Set not found");
    }

    // Revert elimination count from the ELIMINATOR (not the eliminated player)
    const heat = await ctx.db.get(set.heatId);
    if (heat) {
      const eliminatorParticipant = await ctx.db
        .query("leagueParticipants")
        .withIndex("by_league", (q) => q.eq("leagueId", heat.leagueId))
        .filter((q) => q.eq(q.field("playerId"), lastElimination.eliminatorPlayerId))
        .first();

      if (eliminatorParticipant && eliminatorParticipant.totalEliminations > 0) {
        await ctx.db.patch(eliminatorParticipant._id, {
          totalEliminations: eliminatorParticipant.totalEliminations - 1,
        });
      }
    }

    // Get remaining active eliminations after reverting
    const remainingEliminations = await ctx.db
      .query("heatEliminations")
      .withIndex("by_set", (q) => q.eq("setId", args.setId))
      .filter((q) => q.eq(q.field("isReverted"), false))
      .collect();

    const eliminatedPlayerIds = remainingEliminations.map(e => e.eliminatedPlayerId);
    const originalPlayerOrder = set.playerOrder;
    const remainingPlayerIds = originalPlayerOrder.filter(id => !eliminatedPlayerIds.includes(id));

    // If set was completed, reopen it and reshuffle
    if (set.status === "completed") {
      // Use shared reshuffle logic
      const newPlayerOrder = reshuffleRemainingPlayers(remainingPlayerIds);
      
      await ctx.db.patch(args.setId, {
        status: "active",
        winner: undefined,
        currentPlayerOrder: newPlayerOrder,
        serverId: newPlayerOrder[0],
      });

      const heat = await ctx.db.get(set.heatId);
      if (heat) {
        // Revert winner's point
        if (set.winner) {
          const winnerParticipant = await ctx.db
            .query("leagueParticipants")
            .withIndex("by_league", (q) => q.eq("leagueId", heat.leagueId))
            .filter((q) => q.eq(q.field("playerId"), set.winner!))
            .first();

          if (winnerParticipant && winnerParticipant.totalPoints > 0) {
            await ctx.db.patch(winnerParticipant._id, {
              totalPoints: winnerParticipant.totalPoints - 1,
            });
          }
        }

        // If heat was completed, reopen it
        if (heat.status === "completed") {
          await ctx.db.patch(heat._id, {
            status: "active",
            setsCompleted: Math.max(0, heat.setsCompleted - 1),
          });

          // Revert games played for all participants
          for (const playerId of heat.playerIds) {
            const participant = await ctx.db
              .query("leagueParticipants")
              .withIndex("by_league", (q) => q.eq("leagueId", heat.leagueId))
              .filter((q) => q.eq(q.field("playerId"), playerId))
              .first();

            if (participant && participant.gamesPlayed > 0) {
              await ctx.db.patch(participant._id, {
                gamesPlayed: participant.gamesPlayed - 1,
              });
            }
          }
        }
      }
    } else {
      // Just reshuffle the remaining players
      const newPlayerOrder = reshuffleRemainingPlayers(remainingPlayerIds);
      await ctx.db.patch(args.setId, {
        currentPlayerOrder: newPlayerOrder,
        serverId: newPlayerOrder[0],
      });
    }
  },
});
