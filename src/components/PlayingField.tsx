import React from 'react'
import { SimpleUserAvatar } from './UserAvatar'
import { Id } from '../../convex/_generated/dataModel'

export interface Player {
  _id?: Id<'players'>
  name?: string
  currentPoints?: number
  totalPoints?: number
}

export interface PlayingFieldProps {
  players: Player[]
  serverId?: Id<'players'>
  onPlayerClick?: (playerId: Id<'players'>) => void
  showServerIndicator?: boolean
  showPoints?: boolean
  pointsLabel?: string
  className?: string
  playerCardClassName?: string
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl'
  layout?: 'horizontal' | 'vertical' | 'grid'
  disabled?: boolean
}

export function PlayingField({
  players,
  serverId,
  onPlayerClick,
  showServerIndicator = true,
  showPoints = true,
  pointsLabel = 'pts',
  className = '',
  playerCardClassName = '',
  avatarSize = 'md',
  layout = 'horizontal',
  disabled = false,
}: PlayingFieldProps) {
  const handlePlayerClick = (playerId: Id<'players'>) => {
    if (!disabled && onPlayerClick) {
      onPlayerClick(playerId)
    }
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col items-center justify-center gap-4'
      case 'grid':
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
      case 'horizontal':
      default:
        return 'flex min-h-[120px] flex-row-reverse items-center justify-center gap-4 overflow-auto p-4'
    }
  }

  const getPlayerCardClasses = () => {
    const baseClasses =
      'border-border hover:border-destructive relative flex-1 basis-0 rounded-lg border p-4 transition-all'
    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer'
    return `${baseClasses} ${disabledClasses} ${playerCardClassName}`
  }

  return (
    <div className={`mb-6 rounded-lg p-8 ${className}`}>
      <div className={getLayoutClasses()}>
        {players?.map((player, index) => {
          if (!player?._id || !player?.name) return null
          const isServer = player._id === serverId
          const points = player.currentPoints ?? player.totalPoints ?? 0

          return (
            <button
              key={player._id}
              onClick={() => handlePlayerClick(player._id!)}
              className={getPlayerCardClasses()}
              disabled={disabled}
            >
              {/* Player Card */}
              <div className="flex flex-col items-center gap-2">
                {isServer && showServerIndicator && (
                  <div className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full border border-green-500 bg-green-200 text-base font-bold text-green-800 dark:border-green-600 dark:bg-green-900 dark:text-green-200">
                    S
                  </div>
                )}
                <SimpleUserAvatar userId={player._id} size={avatarSize} />
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-center">
                    <h3 className="text-foreground text-lg font-semibold">
                      {player.name}
                    </h3>
                  </div>
                  {showPoints && (
                    <p className="text-foreground/70 text-sm">
                      {points} {pointsLabel}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Specialized components for common use cases
export function GamePlayingField({
  players,
  serverId,
  onPlayerEliminate,
  disabled = false,
}: {
  players: Player[]
  serverId?: Id<'players'>
  onPlayerEliminate: (playerId: Id<'players'>) => void
  disabled?: boolean
}) {
  return (
    <PlayingField
      players={players}
      serverId={serverId}
      onPlayerClick={onPlayerEliminate}
      showServerIndicator={true}
      showPoints={true}
      pointsLabel="pts"
      avatarSize="md"
      layout="horizontal"
      disabled={disabled}
    />
  )
}

export function HeatPlayingField({
  players,
  serverId,
  onPlayerEliminate,
  disabled = false,
}: {
  players: Player[]
  serverId?: Id<'players'>
  onPlayerEliminate: (playerId: Id<'players'>) => void
  disabled?: boolean
}) {
  return (
    <PlayingField
      players={players}
      serverId={serverId}
      onPlayerClick={onPlayerEliminate}
      showServerIndicator={true}
      showPoints={false}
      pointsLabel="pts"
      avatarSize="md"
      layout="horizontal"
      disabled={disabled}
    />
  )
}

export function PlayerDisplayField({
  players,
  layout = 'grid',
  showPoints = false,
}: {
  players: Player[]
  layout?: 'horizontal' | 'vertical' | 'grid'
  showPoints?: boolean
}) {
  return (
    <PlayingField
      players={players}
      onPlayerClick={undefined}
      showServerIndicator={false}
      showPoints={showPoints}
      avatarSize="sm"
      layout={layout}
      disabled={true}
      playerCardClassName="hover:border-border"
    />
  )
}
