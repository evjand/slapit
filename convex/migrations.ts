import {mutation} from './_generated/server'
import {getAuthUserId} from '@convex-dev/auth/server'

// Migration to backfill totalGamesPlayed for existing players
export const backfillGamesPlayed = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx)
        if (!userId) {
            throw new Error('Must be logged in to run migration')
        }

        // Get all players for this user
        const players = await ctx.db
            .query('players')
            .withIndex('by_creator', (q) => q.eq('createdBy', userId))
            .collect()

        let updatedCount = 0

        for (const player of players) {
            // Skip if player already has totalGamesPlayed set (not 0 or undefined)
            if (player.totalGamesPlayed && player.totalGamesPlayed > 0) {
                continue
            }

            // Calculate total games played from gameAnalytics
            const gameAnalytics = await ctx.db
                .query('gameAnalytics')
                .withIndex('by_player', (q) => q.eq('playerId', player._id))
                .collect()

            const totalGamesPlayed = gameAnalytics.reduce(
                (sum, analytics) => sum + analytics.gamesPlayed,
                0,
            )

            // Update player with calculated games played
            await ctx.db.patch(player._id, {
                totalGamesPlayed,
            })

            updatedCount++
        }

        return {
            message: `Migration completed. Updated ${updatedCount} players.`,
            updatedPlayers: updatedCount,
        }
    },
})