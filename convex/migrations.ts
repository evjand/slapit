import { Migrations } from '@convex-dev/migrations'
import { components, internal } from './_generated/api'
import { DataModel } from './_generated/dataModel'

export const migrations = new Migrations<DataModel>(components.migrations)
export const run = migrations.runner()

export const migrationBackfillGamesPlayed = migrations.runner(
  internal.migrations.backfillGamesPlayed,
)

export const backfillGamesPlayed = migrations.define({
  table: 'players',
  migrateOne: async (ctx, player) => {
    if (player.totalGamesPlayed === undefined) {
      const gameAnalytics = await ctx.db
        .query('gameAnalytics')
        .withIndex('by_player', (q) => q.eq('playerId', player._id))
        .collect()

      const totalGamesPlayed = gameAnalytics.reduce(
        (sum, analytics) => sum + analytics.gamesPlayed,
        0,
      )

      await ctx.db.patch(player._id, {
        totalGamesPlayed,
      })
    }
  },
})
