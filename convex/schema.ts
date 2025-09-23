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
  }).index('by_creator', ['createdBy']),

  games: defineTable({
    name: v.string(),
    winningPoints: v.number(),
    status: v.union(
      v.literal('setup'),
      v.literal('active'),
      v.literal('completed'),
    ),
    winner: v.optional(v.id('players')),
    createdBy: v.id('users'),
  }).index('by_creator', ['createdBy']),

  gameParticipants: defineTable({
    gameId: v.id('games'),
    playerId: v.id('players'),
    currentPoints: v.number(),
    isEliminated: v.boolean(),
  }).index('by_game', ['gameId']),

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

  // League tables
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

  heats: defineTable({
    leagueId: v.id('leagues'),
    roundNumber: v.number(),
    heatNumber: v.number(),
    playerIds: v.array(v.id('players')),
    status: v.union(
      v.literal('pending'),
      v.literal('active'),
      v.literal('completed'),
    ),
    setsCompleted: v.number(),
  }).index('by_league_round', ['leagueId', 'roundNumber']),

  heatSets: defineTable({
    heatId: v.id('heats'),
    setNumber: v.number(),
    playerOrder: v.array(v.id('players')),
    currentPlayerOrder: v.optional(v.array(v.id('players'))),
    serverId: v.id('players'),
    status: v.union(v.literal('active'), v.literal('completed')),
    winner: v.optional(v.id('players')),
  }).index('by_heat', ['heatId']),

  heatEliminations: defineTable({
    heatId: v.id('heats'),
    setId: v.id('heatSets'),
    eliminatedPlayerId: v.id('players'),
    eliminatorPlayerId: v.id('players'),
    eliminationOrder: v.number(),
    isReverted: v.boolean(),
  })
    .index('by_set', ['setId'])
    .index('by_heat', ['heatId']),
}

export default defineSchema({
  ...authTables,
  ...applicationTables,
})
