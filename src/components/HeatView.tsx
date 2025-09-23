import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { SimpleUserAvatar } from './UserAvatar'
import { HeatPlayingField } from './PlayingField'
import { Card, CardContent, CardTitle, CardHeader } from './ui/card'
import StatusIndicator from './StatusIndicator'
import { Table, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

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
    console.log('handleEliminatePlayer', playerId)
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
      <Button onClick={onBack}>← Back to League</Button>
      {/* Heat Header */}
      {isHeatComplete && (
        <div className="rounded-lg border p-6 shadow-sm">
          {/* Heat Complete Message */}
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900">
            <p className="text-center font-medium text-green-800 dark:text-green-200">
              🏆 Heat Complete! All {specificHeat.league?.setsPerHeat} sets have
              been played.
            </p>
          </div>
        </div>
      )}

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

          {/* Playing Field */}
          <HeatPlayingField
            players={currentSet.players?.filter((p) => p?._id !== null) || []}
            serverId={currentSet.serverId}
            onPlayerEliminate={handleEliminatePlayer}
            disabled={currentSet.status === 'completed'}
          />

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
      {/* Game Header */}
      <div className="grid grid-cols-2 items-start gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Heat {specificHeat.heatNumber}</span>
              <StatusIndicator status={specificHeat.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg">
              Sets: {specificHeat.setsCompleted} /{' '}
              {specificHeat.league?.setsPerHeat || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="">
              <TableHeader>
                <TableRow>
                  <TableHead align="right">Player</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              {specificHeat.players
                .sort((a, b) => b.totalPoints - a.totalPoints)
                .map((participant) => (
                  <TableRow key={participant._id}>
                    <TableCell className="font-semibold" align="right">
                      {participant.name}
                    </TableCell>
                    <TableCell className="text-primary pr-1 pl-2 font-bold">
                      {participant.totalPoints}
                    </TableCell>
                  </TableRow>
                ))}
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
