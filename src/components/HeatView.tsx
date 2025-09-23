import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { SimpleUserAvatar } from './UserAvatar'

interface HeatViewProps {
  heatId: Id<'heats'>
  onBack: () => void
}

export function HeatView({ heatId, onBack }: HeatViewProps) {
  // First get the heat to find the league ID
  const heatData = useQuery(api.leagues.getHeat, { heatId })
  const currentSet = useQuery(api.heatSets.getCurrentSet, { heatId })
  const startNewSet = useMutation(api.heatSets.startNewSet)
  const eliminatePlayer = useMutation(api.heatSets.eliminatePlayer)
  const revertLastElimination = useMutation(api.heatSets.revertLastElimination)

  const specificHeat = heatData

  // Auto-start next set when current set is completed
  useEffect(() => {
    if (
      currentSet?.status === 'completed' &&
      specificHeat?.status === 'active'
    ) {
      // Check if we can start another set
      const canStartNewSet =
        specificHeat.setsCompleted < (specificHeat.league?.setsPerHeat || 0)

      if (canStartNewSet) {
        const timer = setTimeout(() => {
          handleStartNewSet()
        }, 2000) // 2 second delay to show the completion message

        return () => clearTimeout(timer)
      }
    }
  }, [currentSet?.status, specificHeat?.status, specificHeat?.setsCompleted])

  const handleStartNewSet = async () => {
    try {
      await startNewSet({ heatId })
      toast.success('New set started!')
    } catch (error) {
      toast.error('Failed to start new set')
    }
  }

  const handleEliminatePlayer = async (playerId: Id<'players'>) => {
    if (!currentSet) return

    try {
      await eliminatePlayer({
        heatId,
        setId: currentSet._id,
        playerId,
      })
      toast.success('Player eliminated!')
    } catch (error) {
      toast.error('Failed to eliminate player')
    }
  }

  const handleRevertElimination = async () => {
    if (!currentSet) return

    try {
      await revertLastElimination({ setId: currentSet._id })
      toast.success('Elimination reverted!')
    } catch (error) {
      toast.error('Failed to revert elimination')
    }
  }

  if (!specificHeat) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isHeatComplete =
    specificHeat.setsCompleted >= (specificHeat.league?.setsPerHeat || 0)
  const canStartNewSet =
    !isHeatComplete && (!currentSet || currentSet.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Heat Header */}
      <div className="rounded-lg border p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack}>← Back to League</Button>
            <h1 className="text-foreground text-3xl font-bold">
              Heat {specificHeat.heatNumber}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-foreground/70 text-sm">
              Sets: {specificHeat.setsCompleted} /{' '}
              {specificHeat.league?.setsPerHeat || 0}
            </p>
            <p className="text-foreground/70 text-sm">
              Status: {specificHeat.status}
            </p>
          </div>
        </div>

        {/* Heat Players */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {specificHeat.players?.map((player) => (
            <div
              key={player?._id}
              className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4"
            >
              <h3 className="text-foreground font-semibold">{player?.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {player?.totalPoints}
              </p>
              <p className="text-foreground/70 text-sm">
                {player?.totalEliminations} eliminations
              </p>
            </div>
          ))}
        </div>

        {/* Heat Complete Message */}
        {isHeatComplete && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-center font-medium text-green-800">
              🏆 Heat Complete! All {specificHeat.league?.setsPerHeat} sets have
              been played.
            </p>
          </div>
        )}
      </div>

      {/* Current Set */}
      {currentSet ? (
        <div className="rounded-lg border p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-foreground text-2xl font-bold">
              Set {currentSet.setNumber}
            </h2>
            <div className="flex space-x-3">
              {currentSet.eliminations.length > 0 &&
                currentSet.status === 'active' && (
                  <Button onClick={handleRevertElimination}>
                    Revert Last Elimination
                  </Button>
                )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-foreground/70 text-center text-lg">
              <span className="font-semibold">Server:</span>{' '}
              {
                currentSet.players?.find((p) => p?._id === currentSet.serverId)
                  ?.name
              }
            </p>
          </div>

          {/* Horizontal Player Layout - Only show remaining players */}
          <div className="relative">
            {/* Playing field visualization */}
            <div className="mb-6 rounded-lg border-2 border-green-300 bg-green-100 p-8">
              <div className="flex min-h-[120px] items-center justify-between">
                {currentSet.players?.map((player, index) => {
                  if (!player?._id) return null
                  const isServer = player._id === currentSet.serverId

                  return (
                    <div
                      key={player._id}
                      className={`flex flex-col items-center space-y-3 ${
                        currentSet.players && currentSet.players.length > 4
                          ? 'flex-1'
                          : ''
                      }`}
                      style={{
                        minWidth:
                          currentSet.players && currentSet.players.length > 4
                            ? 'auto'
                            : '150px',
                      }}
                    >
                      {/* Player Card */}
                      <div
                        className={`w-full max-w-[150px] rounded-lg border-2 p-4 transition-all ${
                          isServer
                            ? 'border-green-500 bg-green-200'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="mb-2 text-center">
                          <div className="mb-2 flex justify-center">
                            <SimpleUserAvatar userId={player._id} size="md" />
                          </div>
                          <div className="mb-1 flex items-center justify-center">
                            <h3 className="text-foreground text-sm font-semibold">
                              {player.name}
                            </h3>
                            {isServer && (
                              <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                                S
                              </span>
                            )}
                          </div>
                          <p className="text-foreground/70 text-xs">
                            {player.totalPoints} pts
                          </p>
                        </div>

                        {currentSet.status === 'active' && player._id && (
                          <Button
                            onClick={() => handleEliminatePlayer(player._id!)}
                          >
                            Eliminate
                          </Button>
                        )}
                      </div>

                      {/* Position indicator */}
                      <div className="text-foreground/50 text-xs font-medium">
                        Position {index + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {currentSet.status === 'completed' && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-center font-medium text-green-800">
                🎉 Set Complete! Winner:{' '}
                {
                  currentSet.players?.find((p) => p?._id === currentSet.winner)
                    ?.name
                }
              </p>
              {canStartNewSet ? (
                <p className="mt-1 text-center text-sm text-green-700">
                  Starting next set automatically...
                </p>
              ) : (
                <p className="mt-1 text-center text-sm text-green-700">
                  Heat complete! All sets have been played.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-6 text-center shadow-sm">
          {canStartNewSet ? (
            <>
              <h2 className="text-foreground mb-4 text-2xl font-bold">
                Ready to Start?
              </h2>
              <p className="text-foreground/70 mb-6">
                {specificHeat.players?.length} players ready to play
              </p>
              <Button
                onClick={handleStartNewSet}
                disabled={
                  !specificHeat.players || specificHeat.players.length < 2
                }
              >
                Start Set {specificHeat.setsCompleted + 1}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-foreground mb-4 text-2xl font-bold">
                Heat Complete!
              </h2>
              <p className="text-foreground/70 mb-6">
                All {specificHeat.league?.setsPerHeat} sets have been completed
                for this heat.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
