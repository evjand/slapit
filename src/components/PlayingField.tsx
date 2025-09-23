import React from 'react'
import { SimpleUserAvatar } from './UserAvatar'
import { Id } from '../../convex/_generated/dataModel'
import { cn } from '@/lib/utils'

export interface Player {
  _id?: Id<'players'>
  name?: string
  currentPoints?: number
  totalPoints?: number
  imageStorageId?: Id<'_storage'>
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
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
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
        return 'flex flex-row-reverse items-center justify-center gap-4 overflow-x-auto p-4'
    }
  }

  const getPlayerCardClasses = () => {
    const baseClasses =
      'border-border hover:border-destructive relative flex-shrink-0 rounded-lg border p-4 transition-all bg-card'
    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer'

    // Calculate minimum width based on avatar size to ensure all players fit
    const minWidth =
      avatarSize === '2xl'
        ? 'min-w-[180px]'
        : avatarSize === 'xl'
          ? 'min-w-[160px]'
          : avatarSize === 'lg'
            ? 'min-w-[140px]'
            : avatarSize === 'md'
              ? 'min-w-[120px]'
              : 'min-w-[100px]'

    return `${baseClasses} ${minWidth} ${disabledClasses} ${playerCardClassName}`
  }

  return (
    <div className={`mb-6 rounded-lg ${className}`}>
      <div className={getLayoutClasses()}>
        {players?.map((player, index) => {
          if (!player?._id || !player?.name) return null
          const isServer = player._id === serverId
          const points = player.currentPoints ?? player.totalPoints ?? 0

          return (
            <button
              key={player._id}
              onClick={() => handlePlayerClick(player._id!)}
              className={cn(
                getPlayerCardClasses(),
                isServer &&
                  'border-indigo-500 bg-indigo-200 font-bold text-indigo-800 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-200',
              )}
              disabled={disabled}
            >
              {/* Player Card */}
              <div className="flex flex-col items-center gap-2">
                {isServer && showServerIndicator && (
                  <div
                    className={`absolute -top-2 -right-2 flex items-center justify-center rounded-full border border-indigo-500 bg-indigo-200 font-bold text-indigo-800 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 ${
                      avatarSize === '2xl'
                        ? 'size-12 text-xl'
                        : avatarSize === 'xl'
                          ? 'size-10 text-lg'
                          : avatarSize === 'lg'
                            ? 'size-9 text-base'
                            : 'size-8 text-sm'
                    }`}
                  >
                    S
                  </div>
                )}
                <SimpleUserAvatar
                  userId={player._id}
                  size={avatarSize}
                  imageStorageId={player.imageStorageId}
                />
                <div className="mb-2">
                  <div className="mb-1 flex items-center justify-center">
                    <h3
                      className={cn(
                        'text-foreground leading-loose font-semibold',
                        avatarSize === '2xl'
                          ? 'text-4xl'
                          : avatarSize === 'xl'
                            ? 'text-2xl'
                            : avatarSize === 'lg'
                              ? 'text-xl'
                              : avatarSize === 'md'
                                ? 'text-lg'
                                : 'text-base',
                      )}
                    >
                      {player.name}
                    </h3>
                  </div>
                  {showPoints && (
                    <p
                      className={`text-foreground/70 ${
                        avatarSize === '2xl'
                          ? 'text-lg'
                          : avatarSize === 'xl'
                            ? 'text-base'
                            : avatarSize === 'lg'
                              ? 'text-sm'
                              : 'text-xs'
                      }`}
                    >
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
  className,
  avatarSize = 'md',
}: {
  players: Player[]
  serverId?: Id<'players'>
  onPlayerEliminate: (playerId: Id<'players'>) => void
  disabled?: boolean
  className?: string
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}) {
  return (
    <PlayingField
      players={players}
      serverId={serverId}
      onPlayerClick={onPlayerEliminate}
      showServerIndicator={true}
      showPoints={true}
      pointsLabel="pts"
      avatarSize={avatarSize}
      layout="horizontal"
      disabled={disabled}
      className={className}
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
