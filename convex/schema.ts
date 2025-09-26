import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

const applicationTables = {
  players: defineTable({
    name: v.string(),
    totalWins: v.number(),
    totalPoints: v.number(),
    totalEliminations: v.number(),
    createdBy: v.id('users'),
    imageStorageId: v.optional(v.id('_storage')),
    initials: v.optional(v.string()),
  }).index('by_creator', ['createdBy']),

  // Unified games table - handles both standalone and league games
  games: defineTable({
    name: v.string(),
    // Game configuration
    gameMode: v.optional(
      v.union(
        v.literal('firstToX'), // First to X points wins
        v.literal('fixedSets'), // Fixed number of sets
      ),
    ),
    winningPoints: v.optional(v.number()), // For firstToX mode
    setsPerGame: v.optional(v.number()), // For fixedSets mode

    // Game state
    status: v.union(
      v.literal('setup'),
      v.literal('active'),
      v.literal('completed'),
    ),
    winner: v.optional(v.id('players')),
    setsCompleted: v.optional(v.number()), // Track completed sets

    // League reference (null for standalone games)
    leagueId: v.optional(v.id('leagues')),
    leagueRound: v.optional(v.number()),
    leagueHeatNumber: v.optional(v.number()),

    // Analytics tracking
    trackAnalytics: v.optional(v.boolean()), // Whether to track wins/points globally
    trackLeagueAnalytics: v.optional(v.boolean()), // Whether to track to league table

    // Metadata
    createdBy: v.id('users'),
  })
    .index('by_creator', ['createdBy'])
    .index('by_league', ['leagueId'])
    .index('by_league_round', ['leagueId', 'leagueRound']),

  gameParticipants: defineTable({
    gameId: v.id('games'),
    playerId: v.id('players'),
    currentPoints: v.number(),
    isEliminated: v.boolean(),
  }).index('by_game', ['gameId']),

  // Unified rounds table - handles both game rounds and heat sets
  rounds: defineTable({
    gameId: v.id('games'),
    roundNumber: v.number(),
    playerOrder: v.array(v.id('players')),
    currentPlayerOrder: v.optional(v.array(v.id('players'))),
    serverId: v.id('players'),
    status: v.union(v.literal('active'), v.literal('completed')),
    winner: v.optional(v.id('players')),
  }).index('by_game', ['gameId']),

  eliminations: defineTable({
    gameId: v.id('games'),
    roundId: v.id('rounds'),
    eliminatedPlayerId: v.id('players'),
    eliminatorPlayerId: v.id('players'),
    eliminationOrder: v.number(),
    isReverted: v.boolean(),
  })
    .index('by_round', ['roundId'])
    .index('by_game', ['gameId']),

  // League tables (simplified)
  leagues: defineTable({
    name: v.string(),
    playersPerHeat: v.number(),
    setsPerHeat: v.number(),
    status: v.union(
      v.literal('setup'),
      v.literal('active'),
      v.literal('completed'),
    ),
    currentRound: v.number(),
    createdBy: v.id('users'),
  }).index('by_creator', ['createdBy']),

  leagueParticipants: defineTable({
    leagueId: v.id('leagues'),
    playerId: v.id('players'),
    totalPoints: v.number(),
    totalEliminations: v.number(),
    gamesPlayed: v.number(),
  }).index('by_league', ['leagueId']),

  // Analytics tables for tracking wins, points, eliminations
  gameAnalytics: defineTable({
    gameId: v.id('games'),
    playerId: v.id('players'),
    points: v.number(),
    eliminations: v.number(),
    wins: v.number(),
    gamesPlayed: v.number(),
  })
    .index('by_game', ['gameId'])
    .index('by_player', ['playerId']),

  // League-specific analytics
  leagueAnalytics: defineTable({
    leagueId: v.id('leagues'),
    gameId: v.id('games'),
    playerId: v.id('players'),
    points: v.number(),
    eliminations: v.number(),
    wins: v.number(),
    gamesPlayed: v.number(),
  })
    .index('by_league', ['leagueId'])
    .index('by_league_player', ['leagueId', 'playerId'])
    .index('by_game', ['gameId']),
}

export default defineSchema({
  ...authTables,
  ...applicationTables,
})
