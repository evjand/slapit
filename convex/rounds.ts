import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import {
  shuffleArray,
  calculateEliminator,
  reshuffleRemainingPlayers,
  GamePlayer,
  GameElimination,
  shouldEndGame,
  GameMode,
} from './gameEngine'
import { api } from './_generated/api'

export const getCurrentRound = query({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const round = await ctx.db
      .query('rounds')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first()

    if (!round) {
      return null
    }

    // Get all eliminations for this round (including reverted ones for proper order calculation)
    const allEliminations = await ctx.db
      .query('eliminations')
      .withIndex('by_round', (q) => q.eq('roundId', round._id))
      .collect()

    // Get only non-reverted eliminations
    const activeEliminations = allEliminations.filter((e) => !e.isReverted)

    // Get eliminated player IDs
    const eliminatedPlayerIds = activeEliminations.map(
      (e) => e.eliminatedPlayerId,
    )

    // Get current player order (this should be the shuffled order for the current round)
    const currentPlayerOrder = round.currentPlayerOrder || round.playerOrder
    const activePlayers = await Promise.all(
      currentPlayerOrder
        .filter((playerId) => !eliminatedPlayerIds.includes(playerId))
        .map(async (playerId) => {
          const player = await ctx.db.get(playerId)
          const participant = await ctx.db
            .query('gameParticipants')
            .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
            .filter((q) => q.eq(q.field('playerId'), playerId))
            .first()

          return {
            ...player,
            currentPoints: participant?.currentPoints || 0,
            isEliminated: false,
          }
        }),
    )

    // The current server is always the first player in the current order
    const currentServerId =
      activePlayers.length > 0 ? activePlayers[0]?._id : round.serverId

    return {
      ...round,
      serverId: currentServerId,
      players: activePlayers,
      eliminations: allEliminations,
    }
  },
})

export const startNewRound = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    if (game.status !== 'active') {
      throw new Error('Game is not active')
    }

    // Get active participants (not eliminated from the game)
    const participants = await ctx.db
      .query('gameParticipants')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('isEliminated'), false))
      .collect()

    if (participants.length < 2) {
      throw new Error('Need at least 2 players to start a round')
    }

    // Get the last round to check who served
    const lastRound = await ctx.db
      .query('rounds')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .order('desc')
      .first()

    const playerIds = participants.map((p) => p.playerId)

    // Use shared shuffle logic
    let shuffledPlayers = shuffleArray(playerIds)

    // Ensure the first player (server) is not the same as the last round's server
    if (
      lastRound &&
      shuffledPlayers[0] === lastRound.serverId &&
      shuffledPlayers.length > 1
    ) {
      // Keep shuffling until we get a different server
      let attempts = 0
      while (shuffledPlayers[0] === lastRound.serverId && attempts < 10) {
        shuffledPlayers = shuffleArray(playerIds)
        attempts++
      }
      // If still the same after 10 attempts, just swap the first two players
      if (
        shuffledPlayers[0] === lastRound.serverId &&
        shuffledPlayers.length > 1
      ) {
        ;[shuffledPlayers[0], shuffledPlayers[1]] = [
          shuffledPlayers[1],
          shuffledPlayers[0],
        ]
      }
    }

    // First player in shuffled array becomes the server
    const serverId = shuffledPlayers[0]

    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1

    const roundId = await ctx.db.insert('rounds', {
      gameId: args.gameId,
      roundNumber,
      playerOrder: playerIds, // Keep original order for reference
      currentPlayerOrder: shuffledPlayers, // Current shuffled order
      serverId,
      status: 'active',
    })

    return roundId
  },
})

export const eliminatePlayer = mutation({
  args: {
    gameId: v.id('games'),
    roundId: v.id('rounds'),
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId)
    if (!round) {
      throw new Error('Round not found')
    }

    // Get current active eliminations
    const currentEliminations = await ctx.db
      .query('eliminations')
      .withIndex('by_round', (q) => q.eq('roundId', args.roundId))
      .filter((q) => q.eq(q.field('isReverted'), false))
      .collect()

    const eliminatedPlayerIds = currentEliminations.map(
      (e) => e.eliminatedPlayerId,
    )

    // Check if player is already eliminated
    if (eliminatedPlayerIds.includes(args.playerId)) {
      throw new Error('Player is already eliminated')
    }

    // Get current player order
    const currentPlayerOrder = round.currentPlayerOrder || round.playerOrder

    // Use shared eliminator calculation logic
    const eliminatorId = calculateEliminator(
      args.playerId,
      currentPlayerOrder,
      eliminatedPlayerIds,
    )

    // Record the elimination
    await ctx.db.insert('eliminations', {
      gameId: args.gameId,
      roundId: args.roundId,
      eliminatedPlayerId: args.playerId,
      eliminatorPlayerId: eliminatorId,
      eliminationOrder: currentEliminations.length + 1,
      isReverted: false,
    })

    // Calculate remaining players after this elimination
    const newEliminatedIds = [...eliminatedPlayerIds, args.playerId]
    const remainingPlayerIds = currentPlayerOrder.filter(
      (id) => !newEliminatedIds.includes(id),
    )

    // Check if this is the last elimination (only one player left)
    if (remainingPlayerIds.length === 1) {
      const winnerId = remainingPlayerIds[0]

      // Complete the round
      await ctx.db.patch(args.roundId, {
        status: 'completed',
        winner: winnerId,
      })

      // Award point to winner
      const winnerParticipant = await ctx.db
        .query('gameParticipants')
        .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
        .filter((q) => q.eq(q.field('playerId'), winnerId))
        .first()

      if (winnerParticipant) {
        const newPoints = winnerParticipant.currentPoints + 1
        await ctx.db.patch(winnerParticipant._id, {
          currentPoints: newPoints,
        })

        // Check if game is complete using unified logic
        const game = await ctx.db.get(args.gameId)
        if (game) {
          const gameConfig = {
            mode: game.gameMode as GameMode,
            winningPoints: game.winningPoints,
            setsPerGame: game.setsPerGame,
          }

          if (game.gameMode === 'fixedSets') {
            // For fixed sets mode, increment sets completed first
            const newSetsCompleted = (game.setsCompleted || 0) + 1
            await ctx.db.patch(args.gameId, {
              setsCompleted: newSetsCompleted,
            })

            // Check if game should end after incrementing sets completed
            const currentState = {
              maxPoints: newPoints,
              setsCompleted: newSetsCompleted,
            }

            if (shouldEndGame(gameConfig.mode, gameConfig, currentState)) {
              // Complete the game using the unified completion logic
              await ctx.runMutation(api.games.completeGame, {
                gameId: args.gameId,
                winnerId: winnerId,
              })
            } else {
              // Start a new round for the next set
              await ctx.runMutation(api.rounds.startNewRound, {
                gameId: args.gameId,
              })
            }
          } else {
            // For firstToX mode, check if game should end
            const currentState = {
              maxPoints: newPoints,
              setsCompleted: game.setsCompleted,
            }

            if (shouldEndGame(gameConfig.mode, gameConfig, currentState)) {
              // Complete the game using the unified completion logic
              await ctx.runMutation(api.games.completeGame, {
                gameId: args.gameId,
                winnerId: winnerId,
              })
            } else {
              // Start a new round
              await ctx.runMutation(api.rounds.startNewRound, {
                gameId: args.gameId,
              })
            }
          }
        }
      }
    } else if (remainingPlayerIds.length > 1) {
      // Reshuffle remaining players for next elimination
      const currentServerId = currentPlayerOrder.find(
        (id) => !newEliminatedIds.includes(id),
      )
      const newPlayerOrder = reshuffleRemainingPlayers(
        remainingPlayerIds,
        currentServerId,
      )

      // Update the round with the new player order
      await ctx.db.patch(args.roundId, {
        currentPlayerOrder: newPlayerOrder,
        serverId: newPlayerOrder[0],
      })
    }
  },
})

export const revertLastElimination = mutation({
  args: { roundId: v.id('rounds') },
  handler: async (ctx, args) => {
    const lastElimination = await ctx.db
      .query('eliminations')
      .withIndex('by_round', (q) => q.eq('roundId', args.roundId))
      .filter((q) => q.eq(q.field('isReverted'), false))
      .order('desc')
      .first()

    if (!lastElimination) {
      throw new Error('No elimination to revert')
    }

    // Mark elimination as reverted
    await ctx.db.patch(lastElimination._id, {
      isReverted: true,
    })

    const round = await ctx.db.get(args.roundId)
    if (!round) {
      throw new Error('Round not found')
    }

    // Get remaining active eliminations after reverting
    const remainingEliminations = await ctx.db
      .query('eliminations')
      .withIndex('by_round', (q) => q.eq('roundId', args.roundId))
      .filter((q) => q.eq(q.field('isReverted'), false))
      .collect()

    const eliminatedPlayerIds = remainingEliminations.map(
      (e) => e.eliminatedPlayerId,
    )
    const originalPlayerOrder = round.playerOrder
    const remainingPlayerIds = originalPlayerOrder.filter(
      (id) => !eliminatedPlayerIds.includes(id),
    )

    // If round was completed, reopen it and reshuffle
    if (round.status === 'completed') {
      // Use shared reshuffle logic
      const newPlayerOrder = reshuffleRemainingPlayers(remainingPlayerIds)

      await ctx.db.patch(args.roundId, {
        status: 'active',
        winner: undefined,
        currentPlayerOrder: newPlayerOrder,
        serverId: newPlayerOrder[0],
      })

      // Revert winner's point
      if (round.winner) {
        const winnerParticipant = await ctx.db
          .query('gameParticipants')
          .withIndex('by_game', (q) => q.eq('gameId', lastElimination.gameId))
          .filter((q) => q.eq(q.field('playerId'), round.winner!))
          .first()

        if (winnerParticipant && winnerParticipant.currentPoints > 0) {
          await ctx.db.patch(winnerParticipant._id, {
            currentPoints: winnerParticipant.currentPoints - 1,
          })
        }

        // If game was completed, reopen it
        const game = await ctx.db.get(lastElimination.gameId)
        if (game && game.status === 'completed') {
          await ctx.db.patch(lastElimination.gameId, {
            status: 'active',
            winner: undefined,
          })

          // Revert player stats (this is complex, so we'll keep it simple for now)
          // In a production app, you might want to track these changes more carefully
        }
      }
    } else {
      // Just reshuffle the remaining players
      const newPlayerOrder = reshuffleRemainingPlayers(remainingPlayerIds)
      await ctx.db.patch(args.roundId, {
        currentPlayerOrder: newPlayerOrder,
        serverId: newPlayerOrder[0],
      })
    }
  },
})
