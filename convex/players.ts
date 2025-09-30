import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'
import { Id } from './_generated/dataModel'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    return await ctx.db
      .query('players')
      .withIndex('by_creator', (q) => q.eq('createdBy', userId))
      .collect()
  },
})

export const getImageUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to create players')
    }

    return await ctx.db.insert('players', {
      name: args.name,
      totalWins: 0,
      totalPoints: 0,
      totalEliminations: 0,
      totalGamesPlayed: 0,
      createdBy: userId,
    })
  },
})

export const updateStats = mutation({
  args: {
    playerId: v.id('players'),
    wins: v.optional(v.number()),
    points: v.optional(v.number()),
    eliminations: v.optional(v.number()),
    gamesPlayed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    const updates: any = {}
    if (args.wins !== undefined) {
      updates.totalWins = player.totalWins + args.wins
    }
    if (args.points !== undefined) {
      updates.totalPoints = player.totalPoints + args.points
    }
    if (args.eliminations !== undefined) {
      updates.totalEliminations = player.totalEliminations + args.eliminations
    }
    if (args.gamesPlayed !== undefined) {
      updates.totalGamesPlayed = player.totalGamesPlayed + args.gamesPlayed
    }

    await ctx.db.patch(args.playerId, updates)
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to upload images')
    }
    return await ctx.storage.generateUploadUrl()
  },
})

export const updatePlayerImage = mutation({
  args: {
    playerId: v.id('players'),
    imageStorageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to update player images')
    }

    const player = await ctx.db.get(args.playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (player.createdBy !== userId) {
      throw new Error('Not authorized to update this player')
    }

    // Delete old image if it exists
    if (player.imageStorageId) {
      await ctx.storage.delete(player.imageStorageId)
    }

    await ctx.db.patch(args.playerId, {
      imageStorageId: args.imageStorageId,
    })
  },
})

export const removePlayerImage = mutation({
  args: {
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to remove player images')
    }

    const player = await ctx.db.get(args.playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (player.createdBy !== userId) {
      throw new Error('Not authorized to update this player')
    }

    // Delete the image from storage
    if (player.imageStorageId) {
      await ctx.storage.delete(player.imageStorageId)
    }

    await ctx.db.patch(args.playerId, {
      imageStorageId: undefined,
    })
  },
})

export const deletePlayer = mutation({
  args: {
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to delete players')
    }

    const player = await ctx.db.get(args.playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (player.createdBy !== userId) {
      throw new Error('Not authorized to delete this player')
    }

    // Delete the player's image from storage if it exists
    if (player.imageStorageId) {
      await ctx.storage.delete(player.imageStorageId)
    }

    // Delete the player
    await ctx.db.delete(args.playerId)
  },
})

export const updatePlayerInitials = mutation({
  args: {
    playerId: v.id('players'),
    initials: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Must be logged in to update player initials')
    }

    const player = await ctx.db.get(args.playerId)
    if (!player) {
      throw new Error('Player not found')
    }

    if (player.createdBy !== userId) {
      throw new Error('Not authorized to update this player')
    }

    // Validate initials (max 3 characters, alphanumeric)
    const cleanInitials = args.initials.trim().toUpperCase().slice(0, 3)
    if (!/^[A-Z0-9]+$/.test(cleanInitials)) {
      throw new Error('Initials must contain only letters and numbers')
    }

    await ctx.db.patch(args.playerId, {
      initials: cleanInitials,
    })
  },
})
