import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SimpleUserAvatar } from './UserAvatar'
import { Id } from '../../convex/_generated/dataModel'
import { cn } from '@/lib/utils'

export function TelevisedView() {
  const televisedGame = useQuery(api.games.getTelevisedGame)

  if (!televisedGame) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold">No Active Match</h1>
          <p className="text-2xl text-gray-400">
            Set a game to televised to see it here
          </p>
        </div>
      </div>
    )
  }

  const { participants, currentRound } = televisedGame

  if (!currentRound) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold">No Active Round</h1>
          <p className="text-2xl text-gray-400">
            Waiting for the next round to start
          </p>
        </div>
      </div>
    )
  }

  // Get players in the current round order (not reversed for wall projection)
  const playersInOrder =
    currentRound.currentPlayerOrder
      ?.map((playerId) => {
        const participant = participants.find((p) => p.playerId === playerId)
        return participant
      })
      .filter(Boolean) || []

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-white">
      {/* 10:1 Aspect Ratio Container */}
      <div
        className="bg-accent relative w-full"
        style={{ aspectRatio: '10/1' }}
      >
        {/* Header */}
        <div className="absolute top-4 right-4 left-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{televisedGame.name}</h1>
              <p className="mt-1 text-lg text-gray-400">
                Round {currentRound.roundNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Players Display - Custom player cards matching focus view */}
        <div className="flex h-full items-center justify-center px-8">
          <div className="flex items-center space-x-6">
            {playersInOrder.map((participant, index) => {
              if (!participant) return null

              return (
                <div
                  key={participant.playerId}
                  className={cn(
                    'border-border hover:border-destructive bg-card relative flex-shrink-0 rounded-lg border px-4 py-2 transition-all',
                    participant.playerId === currentRound.serverId &&
                      'border-indigo-500 bg-indigo-200 font-bold text-indigo-800 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-200',
                  )}
                >
                  {/* Player Avatar */}
                  <div className="relative">
                    <SimpleUserAvatar
                      userId={participant.playerId}
                      name={participant.player?.name}
                      imageStorageId={participant.player?.imageStorageId}
                      initials={participant.player?.initials}
                      size={playersInOrder.length > 6 ? 'lg' : 'xl'}
                    />
                    {/* Server Indicator */}
                    {currentRound.serverId === participant.playerId && (
                      <div
                        className={`absolute -top-2 -right-2 flex size-10 items-center justify-center rounded-full border border-indigo-500 bg-indigo-200 text-xl font-bold text-indigo-800 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-200`}
                      >
                        S
                      </div>
                    )}
                  </div>

                  {/* Player Name and Points */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {participant.player?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-300">
                      {participant.currentPoints} pts
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer with game info */}
        <div className="absolute right-4 bottom-4 left-4 z-10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {televisedGame.gameMode === 'firstToX'
                ? `First to ${televisedGame.winningPoints} points`
                : `${televisedGame.setsPerGame} sets per game`}
            </div>
            <div className="text-sm text-gray-400">
              {participants.length} players
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
