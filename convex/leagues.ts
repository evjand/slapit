import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'
import { api } from './_generated/api'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createHeats<T>(players: T[], playersPerHeat: number): T[][] {
  const heats: T[][] = []
  const shuffledPlayers = shuffleArray(players)

  for (let i = 0; i < shuffledPlayers.length; i += playersPerHeat) {
    const heat = shuffledPlayers.slice(i, i + playersPerHeat)
    if (heat.length >= 2) {
      // Only create heats with at least 2 players
      heats.push(heat)
    } else if (heats.length > 0) {
      // Add remaining players to the last heat
      heats[heats.length - 1].push(...heat)
    }
  }

  return heats
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    return await ctx.db
      .query('leagues')
      .withIndex('by_creator', (q) => q.eq('createdBy', userId))
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId)
    if (!league) {
      return null
    }

    const participants = await ctx.db
      .query('leagueParticipants')
      .withIndex('by_league', (q) => q.eq('leagueId', args.leagueId))
      .collect()

    const participantsWithPlayers = await Promise.all(
      participants.map(async (participant) => {
        const player = await ctx.db.get(participant.playerId)
        return {
          ...participant,
          player,
        }
      }),
    )

    return {
      ...league,
      participants: participantsWithPlayers,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    playersPerHeat: v.number(),
    setsPerHeat: v.number(),
    playerIds: v.array(v.id('players')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to create leagues')
    }

    const leagueId = await ctx.db.insert('leagues', {
      name: args.name,
      playersPerHeat: args.playersPerHeat,
      setsPerHeat: args.setsPerHeat,
      status: 'setup',
      currentRound: 0,
      createdBy: userId,
    })

    // Add participants
    for (const playerId of args.playerIds) {
      await ctx.db.insert('leagueParticipants', {
        leagueId,
        playerId,
        totalPoints: 0,
        totalEliminations: 0,
        gamesPlayed: 0,
      })
    }

    return leagueId
  },
})

export const generateHeats = mutation({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId)
    if (!league) {
      throw new Error('League not found')
    }

    const participants = await ctx.db
      .query('leagueParticipants')
      .withIndex('by_league', (q) => q.eq('leagueId', args.leagueId))
      .collect()

    const playerIds = participants.map((p) => p.playerId)
    const heats = createHeats(playerIds, league.playersPerHeat)

    const newRound = league.currentRound + 1

    // Create and start games instead of heats
    for (let i = 0; i < heats.length; i++) {
      await ctx.runMutation(api.games.createAndStartGame, {
        name: `Heat ${i + 1} - Round ${newRound}`,
        gameMode: 'fixedSets',
        setsPerGame: league.setsPerHeat,
        playerIds: heats[i],
        trackAnalytics: false, // Don't track to global stats
        leagueId: args.leagueId,
        leagueRound: newRound,
        leagueHeatNumber: i + 1,
      })
    }

    // Update league
    await ctx.db.patch(args.leagueId, {
      currentRound: newRound,
      status: 'active',
    })

    return newRound
  },
})

export const getHeats = query({
  args: {
    leagueId: v.id('leagues'),
    roundNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId)
    if (!league) {
      return []
    }

    const round = args.roundNumber ?? league.currentRound

    // Query games instead of heats
    const games = await ctx.db
      .query('games')
      .withIndex('by_league_round', (q) =>
        q.eq('leagueId', args.leagueId).eq('leagueRound', round),
      )
      .collect()

    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        // Get participants for this game
        const participants = await ctx.db
          .query('gameParticipants')
          .withIndex('by_game', (q) => q.eq('gameId', game._id))
          .collect()

        const players = await Promise.all(
          participants.map(async (participant) => {
            const player = await ctx.db.get(participant.playerId)
            const leagueParticipant = await ctx.db
              .query('leagueParticipants')
              .withIndex('by_league', (q) => q.eq('leagueId', args.leagueId))
              .filter((q) => q.eq(q.field('playerId'), participant.playerId))
              .first()

            return {
              ...player,
              totalPoints: leagueParticipant?.totalPoints || 0,
              totalEliminations: leagueParticipant?.totalEliminations || 0,
            }
          }),
        )

        return {
          _id: game._id,
          leagueId: game.leagueId,
          roundNumber: game.leagueRound,
          heatNumber: game.leagueHeatNumber,
          playerIds: participants.map((p) => p.playerId),
          status: game.status,
          setsCompleted: game.setsCompleted,
          players,
        }
      }),
    )

    return gamesWithPlayers
  },
})

export const getHeat = query({
  args: { heatId: v.id('games') }, // Now takes a game ID instead of heat ID
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.heatId)
    if (!game || !game.leagueId) {
      return null
    }

    const league = await ctx.db.get(game.leagueId)

    // Get participants for this game
    const participants = await ctx.db
      .query('gameParticipants')
      .withIndex('by_game', (q) => q.eq('gameId', args.heatId))
      .collect()

    const players = await Promise.all(
      participants.map(async (participant) => {
        const player = await ctx.db.get(participant.playerId)
        const leagueParticipant = await ctx.db
          .query('leagueParticipants')
          .withIndex('by_league', (q) => q.eq('leagueId', game.leagueId!))
          .filter((q) => q.eq(q.field('playerId'), participant.playerId))
          .first()

        return {
          ...player,
          totalPoints: leagueParticipant?.totalPoints || 0,
          totalEliminations: leagueParticipant?.totalEliminations || 0,
        }
      }),
    )

    return {
      _id: game._id,
      leagueId: game.leagueId,
      roundNumber: game.leagueRound,
      heatNumber: game.leagueHeatNumber,
      playerIds: participants.map((p) => p.playerId),
      status: game.status,
      setsCompleted: game.setsCompleted,
      league,
      players,
    }
  },
})

export const getLeagueTable = query({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query('leagueParticipants')
      .withIndex('by_league', (q) => q.eq('leagueId', args.leagueId))
      .collect()

    const participantsWithPlayers = await Promise.all(
      participants.map(async (participant) => {
        const player = await ctx.db.get(participant.playerId)
        return {
          ...participant,
          player,
        }
      }),
    )

    // Sort by points (descending), then by eliminations (ascending as tiebreaker)
    return participantsWithPlayers.sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints
      }
      return b.totalEliminations - a.totalEliminations
    })
  },
})
