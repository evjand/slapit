import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

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
            (e) => e.eliminatorPlayerId === participant.playerId
          ).length,
        }
      })
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
    winningPoints: v.number(),
    playerIds: v.array(v.id('players')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to create games')
    }

    const gameId = await ctx.db.insert('games', {
      name: args.name,
      winningPoints: args.winningPoints,
      status: 'setup',
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

export const completeGame = mutation({
  args: {
    gameId: v.id('games'),
    winnerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, {
      status: 'completed',
      winner: args.winnerId,
    })
  },
})
