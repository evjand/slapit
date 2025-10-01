import { Id } from '../../convex/_generated/dataModel'

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

export interface Player {
  _id?: Id<'players'>
  _creationTime?: number
  name?: string
  totalWins?: number
  totalPoints?: number
  totalEliminations?: number
  createdBy?: Id<'users'>
  imageStorageId?: Id<'_storage'>
  initials?: string
  currentPoints?: number
  isEliminated?: boolean
}

export interface Game {
  _id: Id<'games'>
  _creationTime: number
  name: string
  gameMode?: 'firstToX' | 'fixedSets'
  winningPoints?: number
  setsPerGame?: number
  status: 'setup' | 'active' | 'completed' | 'cancelled'
  winner?: Id<'players'>
  setsCompleted?: number
  leagueId?: Id<'leagues'>
  leagueRound?: number
  leagueHeatNumber?: number
  trackAnalytics?: boolean
  trackLeagueAnalytics?: boolean
  createdBy: Id<'users'>
}

export interface League {
  _id: Id<'leagues'>
  _creationTime: number
  name: string
  playersPerHeat: number
  setsPerHeat: number
  status: 'setup' | 'active' | 'completed'
  currentRound: number
  createdBy: Id<'users'>
}

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export interface GameParticipant {
  _id: Id<'gameParticipants'>
  _creationTime: number
  gameId: Id<'games'>
  playerId: Id<'players'>
  currentPoints: number
  isEliminated: boolean
}

export interface LeagueParticipant {
  _id: Id<'leagueParticipants'>
  _creationTime: number
  leagueId: Id<'leagues'>
  playerId: Id<'players'>
  totalPoints: number
  totalEliminations: number
  gamesPlayed: number
}

export interface Round {
  _id: Id<'rounds'>
  _creationTime: number
  gameId: Id<'games'>
  roundNumber: number
  playerOrder: Id<'players'>[]
  currentPlayerOrder?: Id<'players'>[]
  serverId: Id<'players'>
  status: 'active' | 'completed'
  winner?: Id<'players'>
}

export interface Elimination {
  _id: Id<'eliminations'>
  _creationTime: number
  gameId: Id<'games'>
  roundId: Id<'rounds'>
  eliminatedPlayerId: Id<'players'>
  eliminatorPlayerId: Id<'players'>
  eliminationOrder: number
  isReverted: boolean
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface GameAnalytics {
  _id: Id<'gameAnalytics'>
  _creationTime: number
  gameId: Id<'games'>
  playerId: Id<'players'>
  points: number
  eliminations: number
  wins: number
  gamesPlayed: number
}

export interface LeagueAnalytics {
  _id: Id<'leagueAnalytics'>
  _creationTime: number
  leagueId: Id<'leagues'>
  gameId: Id<'games'>
  playerId: Id<'players'>
  points: number
  eliminations: number
  wins: number
  gamesPlayed: number
}

// ============================================================================
// ENRICHED TYPES (with populated relationships)
// ============================================================================

export interface GameWithParticipants extends Game {
  participants: (GameParticipant & { player: Player })[]
}

export interface GameWithRounds extends Game {
  rounds: Round[]
  currentRound?: Round
}

export interface GameWithDetails extends Game {
  participants: (GameParticipant & { player: Player })[]
  rounds: Round[]
  currentRound?: Round
  eliminations: Elimination[]
}

export interface LeagueWithParticipants extends League {
  participants: (LeagueParticipant & { player: Player })[]
}

export interface LeagueWithGames extends League {
  games: GameWithParticipants[]
}

export interface LeagueWithDetails extends League {
  participants: (LeagueParticipant & { player: Player })[]
  games: GameWithParticipants[]
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface GameViewProps {
  gameId: Id<'games'>
  onBack?: () => void
}

export interface HeatViewProps {
  heatId: Id<'games'> // Now takes a game ID instead of heat ID
  onBack: () => void
}

export interface LeagueViewProps {
  leagueId: Id<'leagues'>
  onBack?: () => void
}

export interface PlayerCardProps {
  player: Player
  currentPoints?: number
  isEliminated?: boolean
  isWinner?: boolean
  showStats?: boolean
  onClick?: () => void
}

export interface PlayingFieldProps {
  players: Player[]
  currentPlayerOrder?: Id<'players'>[]
  serverId?: Id<'players'>
  onPlayerClick?: (playerId: Id<'players'>) => void
  onEliminatePlayer?: (playerId: Id<'players'>) => void
  onRevertLastElimination?: () => void
  showServerIndicator?: boolean
  showPoints?: boolean
  pointsLabel?: string
  className?: string
  playerCardClassName?: string
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  layout?: 'horizontal' | 'vertical' | 'grid'
  disabled?: boolean
  canEliminate?: boolean
  canRevert?: boolean
}

export interface AddPlayersToGameProps {
  gameId: Id<'games'>
  currentPlayerIds: Id<'players'>[]
  onPlayersAdded?: () => void
  onClose: () => void
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CreateGameFormData {
  name: string
  gameMode: 'firstToX' | 'fixedSets'
  winningPoints?: number
  setsPerGame?: number
  playerIds: Id<'players'>[]
  trackAnalytics?: boolean
  leagueId?: Id<'leagues'>
  leagueRound?: number
  leagueHeatNumber?: number
}

export interface CreateLeagueFormData {
  name: string
  playersPerHeat: number
  setsPerHeat: number
  playerIds: Id<'players'>[]
}

export interface CreatePlayerFormData {
  name: string
  initials?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface GameListResponse {
  games: GameWithParticipants[]
  total: number
}

export interface LeagueListResponse {
  leagues: LeagueWithParticipants[]
  total: number
}

export interface PlayerListResponse {
  players: Player[]
  total: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type GameStatus = Game['status']
export type LeagueStatus = League['status']
export type RoundStatus = Round['status']
export type GameMode = NonNullable<Game['gameMode']>

export interface GameConfig {
  mode: GameMode
  winningPoints?: number
  setsPerGame?: number
}

export interface GameStats {
  totalPoints: number
  totalEliminations: number
  totalWins: number
  gamesPlayed: number
}

export interface LeagueStats {
  totalPoints: number
  totalEliminations: number
  gamesPlayed: number
  leagueRank?: number
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isGameWithParticipants(
  game: Game | GameWithParticipants,
): game is GameWithParticipants {
  return 'participants' in game
}

export function isGameWithRounds(
  game: Game | GameWithRounds,
): game is GameWithRounds {
  return 'rounds' in game
}

export function isGameWithDetails(
  game: Game | GameWithDetails,
): game is GameWithDetails {
  return 'participants' in game && 'rounds' in game && 'eliminations' in game
}

export function isLeagueWithParticipants(
  league: League | LeagueWithParticipants,
): league is LeagueWithParticipants {
  return 'participants' in league
}

export function isLeagueWithGames(
  league: League | LeagueWithGames,
): league is LeagueWithGames {
  return 'games' in league
}

export function isLeagueWithDetails(
  league: League | LeagueWithDetails,
): league is LeagueWithDetails {
  return 'participants' in league && 'games' in league
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GAME_MODES = {
  FIRST_TO_X: 'firstToX' as const,
  FIXED_SETS: 'fixedSets' as const,
} as const

export const GAME_STATUSES = {
  SETUP: 'setup' as const,
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
} as const

export const LEAGUE_STATUSES = {
  SETUP: 'setup' as const,
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
} as const

export const ROUND_STATUSES = {
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
} as const
