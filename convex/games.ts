import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'
import { api } from './_generated/api'
import {
  updateGameAnalytics,
  updateLeagueAnalytics,
  updatePlayerGlobalStats,
  updateLeagueParticipantStats,
  shouldEndGame,
  GameMode,
} from './gameEngine'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    return await ctx.db
      .query('games')
      .withIndex('by_creator', (q) => q.eq('createdBy', userId))
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) {
      return null
    }

    const participants = await ctx.db
      .query('gameParticipants')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .collect()

    const eliminations = await ctx.db
      .query('eliminations')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('isReverted'), false))
      .collect()

    const playersWithStats = await Promise.all(
      participants.map(async (participant) => {
        const player = await ctx.db.get(participant.playerId)
        return {
          ...participant,
          player,
          totalEliminations: eliminations.filter(
            (e) => e.eliminatorPlayerId === participant.playerId,
          ).length,
        }
      }),
    )

    return {
      ...game,
      participants: playersWithStats,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    gameMode: v.union(v.literal('firstToX'), v.literal('fixedSets')),
    winningPoints: v.optional(v.number()),
    setsPerGame: v.optional(v.number()),
    playerIds: v.array(v.id('players')),
    trackAnalytics: v.optional(v.boolean()),
    leagueId: v.optional(v.id('leagues')),
    leagueRound: v.optional(v.number()),
    leagueHeatNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to create games')
    }

    // Validate game mode configuration
    if (args.gameMode === 'firstToX' && !args.winningPoints) {
      throw new Error('winningPoints is required for firstToX mode')
    }
    if (args.gameMode === 'fixedSets' && !args.setsPerGame) {
      throw new Error('setsPerGame is required for fixedSets mode')
    }

    const gameId = await ctx.db.insert('games', {
      name: args.name,
      gameMode: args.gameMode,
      winningPoints: args.winningPoints,
      setsPerGame: args.setsPerGame,
      status: 'setup',
      setsCompleted: 0,
      leagueId: args.leagueId,
      leagueRound: args.leagueRound,
      leagueHeatNumber: args.leagueHeatNumber,
      trackAnalytics: args.trackAnalytics ?? true,
      trackLeagueAnalytics: !!args.leagueId,
      createdBy: userId,
    })

    // Add participants
    for (const playerId of args.playerIds) {
      await ctx.db.insert('gameParticipants', {
        gameId,
        playerId,
        currentPoints: 0,
        isEliminated: false,
      })
    }

    return gameId
  },
})

export const startGame = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { status: 'active' })
  },
})

export const createAndStartGame = mutation({
  args: {
    name: v.string(),
    gameMode: v.union(v.literal('firstToX'), v.literal('fixedSets')),
    winningPoints: v.optional(v.number()),
    setsPerGame: v.optional(v.number()),
    playerIds: v.array(v.id('players')),
    trackAnalytics: v.optional(v.boolean()),
    leagueId: v.optional(v.id('leagues')),
    leagueRound: v.optional(v.number()),
    leagueHeatNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to create games')
    }

    // Validate game mode configuration
    if (args.gameMode === 'firstToX' && !args.winningPoints) {
      throw new Error('winningPoints is required for firstToX mode')
    }
    if (args.gameMode === 'fixedSets' && !args.setsPerGame) {
      throw new Error('setsPerGame is required for fixedSets mode')
    }

    // Create the game with active status
    const gameId = await ctx.db.insert('games', {
      name: args.name,
      gameMode: args.gameMode,
      winningPoints: args.winningPoints,
      setsPerGame: args.setsPerGame,
      status: 'active',
      setsCompleted: 0,
      leagueId: args.leagueId,
      leagueRound: args.leagueRound,
      leagueHeatNumber: args.leagueHeatNumber,
      trackAnalytics: args.trackAnalytics ?? true,
      trackLeagueAnalytics: !!args.leagueId,
      createdBy: userId,
    })

    // Add participants
    for (const playerId of args.playerIds) {
      await ctx.db.insert('gameParticipants', {
        gameId,
        playerId,
        currentPoints: 0,
        isEliminated: false,
      })
    }

    // Start the first round
    await ctx.runMutation(api.rounds.startNewRound, { gameId })

    return gameId
  },
})

export const addParticipantsToGame = mutation({
  args: {
    gameId: v.id('games'),
    playerIds: v.array(v.id('players')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to modify games')
    }

    const game = await ctx.db.get(args.gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    if (game.createdBy !== userId) {
      throw new Error('Not authorized to modify this game')
    }

    if (game.status !== 'active') {
      throw new Error('Can only add players to active games')
    }

    // Get existing participants to avoid duplicates
    const existingParticipants = await ctx.db
      .query('gameParticipants')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .collect()

    const existingPlayerIds = new Set(
      existingParticipants.map((p) => p.playerId),
    )

    // Add new participants (skip if already in game)
    for (const playerId of args.playerIds) {
      if (!existingPlayerIds.has(playerId)) {
        await ctx.db.insert('gameParticipants', {
          gameId: args.gameId,
          playerId,
          currentPoints: 0,
          isEliminated: false,
        })
      }
    }

    return { success: true }
  },
})

export const completeGame = mutation({
  args: {
    gameId: v.id('games'),
    winnerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    // Update game status
    await ctx.db.patch(args.gameId, {
      status: 'completed',
      winner: args.winnerId,
    })

    // Get all participants for analytics
    const participants = await ctx.db
      .query('gameParticipants')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .collect()

    // Get eliminations for each player
    const eliminations = await ctx.db
      .query('eliminations')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('isReverted'), false))
      .collect()

    // Track analytics for each participant
    for (const participant of participants) {
      const playerEliminations = eliminations.filter(
        (e) => e.eliminatorPlayerId === participant.playerId,
      ).length

      const isWinner = participant.playerId === args.winnerId
      const points = participant.currentPoints
      const wins = isWinner ? 1 : 0
      const gamesPlayed = 1

      // Update game-specific analytics
      if (game.trackAnalytics) {
        await updateGameAnalytics(
          ctx,
          args.gameId,
          participant.playerId,
          points,
          playerEliminations,
          wins,
          gamesPlayed,
        )

        // Update global player stats
        await updatePlayerGlobalStats(
          ctx,
          participant.playerId,
          points,
          playerEliminations,
          wins,
        )
      }

      // Update league analytics if this is a league game
      if (game.trackLeagueAnalytics && game.leagueId) {
        await updateLeagueAnalytics(
          ctx,
          game.leagueId,
          args.gameId,
          participant.playerId,
          points,
          playerEliminations,
          wins,
          gamesPlayed,
        )

        // Update league participant stats
        await updateLeagueParticipantStats(
          ctx,
          game.leagueId,
          participant.playerId,
          points,
          playerEliminations,
          gamesPlayed,
        )
      }
    }
  },
})
