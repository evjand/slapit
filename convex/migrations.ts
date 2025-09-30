import {internalMutation} from './_generated/server'

// Migration to backfill totalGamesPlayed for existing players
export const backfillGamesPlayed = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Get all players across all users
        const players = await ctx.db
            .query('players')
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