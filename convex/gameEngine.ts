import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
import { QueryCtx, MutationCtx } from './_generated/server'

// Shared types for game logic
export interface GamePlayer {
  _id: Id<'players'>
  name: string
  currentPoints?: number
  totalPoints?: number
  totalEliminations?: number
}

export interface GameElimination {
  _id: Id<'eliminations'>
  eliminatedPlayerId: Id<'players'>
  eliminatorPlayerId: Id<'players'>
  eliminationOrder: number
  isReverted: boolean
}

export interface GameRound {
  _id: Id<'rounds'>
  roundNumber: number
  playerOrder: Id<'players'>[]
  currentPlayerOrder?: Id<'players'>[]
  serverId: Id<'players'>
  status: 'active' | 'completed'
  winner?: Id<'players'>
}

// Shared shuffle function with better randomness
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]

  const getRandomInt = (max: number) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      return array[0] % max
    }
    return Math.floor(Math.random() * max)
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Shared function to determine eliminator using circular logic
export function calculateEliminator(
  eliminatedPlayerId: Id<'players'>,
  currentPlayerOrder: Id<'players'>[],
  eliminatedPlayerIds: Id<'players'>[],
): Id<'players'> {
  const playerIndex = currentPlayerOrder.indexOf(eliminatedPlayerId)
  if (playerIndex === -1) {
    throw new Error('Player not in current order')
  }

  // The eliminator is the player who comes BEFORE the eliminated player in the circle
  let eliminatorIndex =
    playerIndex === 0 ? currentPlayerOrder.length - 1 : playerIndex - 1
  let eliminatorId = currentPlayerOrder[eliminatorIndex]

  // If the calculated eliminator is already eliminated, find the next active player going backwards
  while (
    eliminatedPlayerIds.includes(eliminatorId) &&
    eliminatorId !== eliminatedPlayerId
  ) {
    eliminatorIndex =
      eliminatorIndex === 0
        ? currentPlayerOrder.length - 1
        : eliminatorIndex - 1
    eliminatorId = currentPlayerOrder[eliminatorIndex]
  }

  // Safety check - if we've gone full circle, something is wrong
  if (eliminatorId === eliminatedPlayerId) {
    throw new Error('Cannot determine eliminator - invalid game state')
  }

  return eliminatorId
}

// Shared function to get next server (avoiding same server)
export function getNextServer(
  remainingPlayerIds: Id<'players'>[],
  currentServerId?: Id<'players'>,
): Id<'players'> {
  if (remainingPlayerIds.length === 0) {
    throw new Error('No players remaining')
  }

  let newPlayerOrder = shuffleArray(remainingPlayerIds)

  // Ensure the new server is not the same as current server
  if (
    currentServerId &&
    newPlayerOrder[0] === currentServerId &&
    newPlayerOrder.length > 1
  ) {
    let attempts = 0
    while (newPlayerOrder[0] === currentServerId && attempts < 10) {
      newPlayerOrder = shuffleArray(remainingPlayerIds)
      attempts++
    }
    // If still the same after 10 attempts, just swap the first two players
    if (newPlayerOrder[0] === currentServerId && newPlayerOrder.length > 1) {
      ;[newPlayerOrder[0], newPlayerOrder[1]] = [
        newPlayerOrder[1],
        newPlayerOrder[0],
      ]
    }
  }

  return newPlayerOrder[0]
}

// Shared function to reshuffle remaining players
export function reshuffleRemainingPlayers(
  remainingPlayerIds: Id<'players'>[],
  currentServerId?: Id<'players'>,
): Id<'players'>[] {
  if (remainingPlayerIds.length === 0) {
    return []
  }

  let newPlayerOrder = shuffleArray(remainingPlayerIds)

  // Ensure the new server is not the same as current server
  if (
    currentServerId &&
    newPlayerOrder[0] === currentServerId &&
    newPlayerOrder.length > 1
  ) {
    let attempts = 0
    while (newPlayerOrder[0] === currentServerId && attempts < 10) {
      newPlayerOrder = shuffleArray(remainingPlayerIds)
      attempts++
    }
    // If still the same after 10 attempts, just swap the first two players
    if (newPlayerOrder[0] === currentServerId && newPlayerOrder.length > 1) {
      ;[newPlayerOrder[0], newPlayerOrder[1]] = [
        newPlayerOrder[1],
        newPlayerOrder[0],
      ]
    }
  }

  return newPlayerOrder
}

// Game mode types
export type GameMode = 'firstToX' | 'fixedSets'

export interface GameConfig {
  mode: GameMode
  winningPoints?: number // For firstToX mode
  setsPerGame?: number // For fixedSets mode
}

// Check if game should end based on mode
export function shouldEndGame(
  mode: GameMode,
  config: { winningPoints?: number; setsPerGame?: number },
  currentState: { setsCompleted?: number; maxPoints?: number },
): boolean {
  switch (mode) {
    case 'firstToX':
      return (currentState.maxPoints || 0) >= (config.winningPoints || 0)
    case 'fixedSets':
      return (currentState.setsCompleted || 0) >= (config.setsPerGame || 0)
    default:
      return false
  }
}

// Analytics tracking functions
export async function updateGameAnalytics(
  ctx: MutationCtx,
  gameId: Id<'games'>,
  playerId: Id<'players'>,
  points: number,
  eliminations: number,
  wins: number,
  gamesPlayed: number,
) {
  // Check if analytics entry exists
  const existingAnalytics = await ctx.db
    .query('gameAnalytics')
    .withIndex('by_game', (q) => q.eq('gameId', gameId))
    .filter((q) => q.eq(q.field('playerId'), playerId))
    .first()

  if (existingAnalytics) {
    await ctx.db.patch(existingAnalytics._id, {
      points: existingAnalytics.points + points,
      eliminations: existingAnalytics.eliminations + eliminations,
      wins: existingAnalytics.wins + wins,
      gamesPlayed: existingAnalytics.gamesPlayed + gamesPlayed,
    })
  } else {
    await ctx.db.insert('gameAnalytics', {
      gameId,
      playerId,
      points,
      eliminations,
      wins,
      gamesPlayed,
    })
  }
}

export async function updateLeagueAnalytics(
  ctx: MutationCtx,
  leagueId: Id<'leagues'>,
  gameId: Id<'games'>,
  playerId: Id<'players'>,
  points: number,
  eliminations: number,
  wins: number,
  gamesPlayed: number,
) {
  // Check if analytics entry exists
  const existingAnalytics = await ctx.db
    .query('leagueAnalytics')
    .withIndex('by_league_player', (q) =>
      q.eq('leagueId', leagueId).eq('playerId', playerId),
    )
    .first()

  if (existingAnalytics) {
    await ctx.db.patch(existingAnalytics._id, {
      points: existingAnalytics.points + points,
      eliminations: existingAnalytics.eliminations + eliminations,
      wins: existingAnalytics.wins + wins,
      gamesPlayed: existingAnalytics.gamesPlayed + gamesPlayed,
    })
  } else {
    await ctx.db.insert('leagueAnalytics', {
      leagueId,
      gameId,
      playerId,
      points,
      eliminations,
      wins,
      gamesPlayed,
    })
  }
}

// Update player global stats
export async function updatePlayerGlobalStats(
  ctx: MutationCtx,
  playerId: Id<'players'>,
  points: number,
  eliminations: number,
  wins: number,
) {
  const player = await ctx.db.get(playerId)
  if (player) {
    await ctx.db.patch(playerId, {
      totalPoints: player.totalPoints + points,
      totalEliminations: player.totalEliminations + eliminations,
      totalWins: player.totalWins + wins,
    })
  }
}

// Update league participant stats
export async function updateLeagueParticipantStats(
  ctx: MutationCtx,
  leagueId: Id<'leagues'>,
  playerId: Id<'players'>,
  points: number,
  eliminations: number,
  gamesPlayed: number,
) {
  const participant = await ctx.db
    .query('leagueParticipants')
    .withIndex('by_league', (q) => q.eq('leagueId', leagueId))
    .filter((q) => q.eq(q.field('playerId'), playerId))
    .first()

  if (participant) {
    await ctx.db.patch(participant._id, {
      totalPoints: participant.totalPoints + points,
      totalEliminations: participant.totalEliminations + eliminations,
      gamesPlayed: participant.gamesPlayed + gamesPlayed,
    })
  }
}
