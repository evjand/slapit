import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
import { MutationCtx } from './_generated/server'

const DEFAULT_ELO_RATING = 1200
const K_FACTOR = 32

// Calculate expected score for ELO
function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

// Calculate new ELO rating
function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number, // 1 for win, 0 for loss
): number {
  return Math.round(currentRating + K_FACTOR * (actualScore - expectedScore))
}

// Get or create ELO rating for a player
export async function getOrCreatePlayerEloRating(
  ctx: MutationCtx,
  playerId: Id<'players'>,
  userId: Id<'users'>,
) {
  const existing = await ctx.db
    .query('playerEloRatings')
    .withIndex('by_player', (q) => q.eq('playerId', playerId))
    .first()

  if (existing) {
    return existing
  }

  // Create new ELO rating
  const eloRatingId = await ctx.db.insert('playerEloRatings', {
    playerId,
    currentRating: DEFAULT_ELO_RATING,
    gamesPlayed: 0,
    peakRating: DEFAULT_ELO_RATING,
    lastUpdated: Date.now(),
    createdBy: userId,
  })

  return await ctx.db.get(eloRatingId)
}

// Calculate ELO changes for multiplayer game (pairwise approach)
export async function calculateMultiplayerEloChanges(
  ctx: MutationCtx,
  gameId: Id<'games'>,
  winnerId: Id<'players'>,
  participantIds: Id<'players'>[],
  userId: Id<'users'>,
) {
  // Get all player ELO ratings
  const playerRatings = new Map<Id<'players'>, number>()
  
  for (const playerId of participantIds) {
    const eloRating = await getOrCreatePlayerEloRating(ctx, playerId, userId)
    if (eloRating) {
      playerRatings.set(playerId, eloRating.currentRating)
    }
  }

  const winnerRating = playerRatings.get(winnerId)!
  const eloChanges = new Map<Id<'players'>, { before: number; after: number; change: number }>()

  // Calculate pairwise ELO changes
  for (const [playerId, playerRating] of playerRatings) {
    if (playerId === winnerId) {
      // Winner gains rating from all other players
      let totalExpectedScore = 0
      let totalActualScore = participantIds.length - 1 // Won against all others

      // Calculate expected score against all opponents
      for (const [opponentId, opponentRating] of playerRatings) {
        if (opponentId !== winnerId) {
          totalExpectedScore += calculateExpectedScore(winnerRating, opponentRating)
        }
      }

      const newRating = calculateNewRating(winnerRating, totalExpectedScore, totalActualScore)
      eloChanges.set(winnerId, {
        before: winnerRating,
        after: newRating,
        change: newRating - winnerRating,
      })
    } else {
      // Loser loses rating to the winner
      const expectedScore = calculateExpectedScore(playerRating, winnerRating)
      const actualScore = 0 // Lost
      const newRating = calculateNewRating(playerRating, expectedScore, actualScore)
      
      eloChanges.set(playerId, {
        before: playerRating,
        after: newRating,
        change: newRating - playerRating,
      })
    }
  }

  return eloChanges
}

// Update player ELO ratings after a game
export async function updatePlayerEloRatings(
  ctx: MutationCtx,
  gameId: Id<'games'>,
  eloChanges: Map<Id<'players'>, { before: number; after: number; change: number }>,
  userId: Id<'users'>,
) {
  for (const [playerId, change] of eloChanges) {
    // Update player ELO rating
    const eloRating = await ctx.db
      .query('playerEloRatings')
      .withIndex('by_player', (q) => q.eq('playerId', playerId))
      .first()

    if (eloRating) {
      const newPeakRating = Math.max(eloRating.peakRating, change.after)
      
      await ctx.db.patch(eloRating._id, {
        currentRating: change.after,
        gamesPlayed: eloRating.gamesPlayed + 1,
        peakRating: newPeakRating,
        lastUpdated: Date.now(),
      })

      // Record ELO history
      await ctx.db.insert('eloHistory', {
        gameId,
        playerId,
        ratingBefore: change.before,
        ratingAfter: change.after,
        ratingChange: change.change,
        createdBy: userId,
      })
    }
  }
}

// Query to get player's current ELO rating
export const getPlayerEloRating = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    return await ctx.db
      .query('playerEloRatings')
      .withIndex('by_player', (q) => q.eq('playerId', args.playerId))
      .first()
  },
})

// Query to get ELO leaderboard
export const getEloLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const eloRatings = await ctx.db
      .query('playerEloRatings')
      .withIndex('by_creator', (q) => q.eq('createdBy', userId))
      .collect()

    // Get player names
    const playersWithElo = await Promise.all(
      eloRatings.map(async (rating) => {
        const player = await ctx.db.get(rating.playerId)
        return {
          ...rating,
          playerName: player?.name || 'Unknown',
          playerInitials: player?.initials,
        }
      })
    )

    // Sort by current rating (highest first)
    return playersWithElo.sort((a, b) => b.currentRating - a.currentRating)
  },
})

// Query to get player's ELO history
export const getPlayerEloHistory = query({
  args: { playerId: v.id('players') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query('eloHistory')
      .withIndex('by_player', (q) => q.eq('playerId', args.playerId))
      .order('desc')
      .take(50) // Last 50 games
  },
})