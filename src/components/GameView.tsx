import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SimpleUserAvatar } from './UserAvatar'
import { Table, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import StatusIndicator from './StatusIndicator'
import { GamePlayingField } from './PlayingField'

interface GameViewProps {
  gameId: Id<'games'>
}

export function GameView({ gameId }: GameViewProps) {
  const game = useQuery(api.games.get, { gameId })
  const currentRound = useQuery(api.rounds.getCurrentRound, { gameId })
  const startNewRound = useMutation(api.rounds.startNewRound)
  const eliminatePlayer = useMutation(api.rounds.eliminatePlayer)
  const revertLastElimination = useMutation(api.rounds.revertLastElimination)

  // Auto-start next round when current round is completed
  useEffect(() => {
    if (currentRound?.status === 'completed' && game?.status === 'active') {
      const timer = setTimeout(() => {
        handleStartNewRound()
      }, 2000) // 2 second delay to show the completion message

      return () => clearTimeout(timer)
    }
  }, [currentRound?.status, game?.status])

  const handleStartNewRound = async () => {
    try {
      await startNewRound({ gameId })
      toast.success('New round started!')
    } catch (error) {
      toast.error('Failed to start new round')
    }
  }

  const handleEliminatePlayer = async (playerId: Id<'players'>) => {
    if (!currentRound) return

    try {
      await eliminatePlayer({
        gameId,
        roundId: currentRound._id,
        playerId,
      })
      toast.success('Player eliminated!')
    } catch (error) {
      toast.error('Failed to eliminate player')
    }
  }

  const handleRevertElimination = async () => {
    if (!currentRound) return

    try {
      await revertLastElimination({ roundId: currentRound._id })
      toast.success('Elimination reverted!')
    } catch (error) {
      toast.error('Failed to revert elimination')
    }
  }

  if (!game) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (game.status === 'completed') {
    const winner = game.participants.find((p) => p.playerId === game.winner)
    return (
      <div className="rounded-lg border p-8 text-center shadow-sm">
        <h1 className="mb-4 text-4xl font-bold text-green-600">
          🏆 Game Complete!
        </h1>
        <h2 className="text-foreground mb-2 text-2xl font-semibold">
          {winner?.player?.name} Wins!
        </h2>
        <p className="text-foreground/70 mb-6 text-lg">
          Final Score: {winner?.currentPoints} / {game.winningPoints} points
        </p>

        <div className="rounded-lg p-6">
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            Final Standings
          </h3>
          <div className="space-y-2">
            {game.participants
              .sort((a, b) => b.currentPoints - a.currentPoints)
              .map((participant, index) => (
                <div
                  key={participant.playerId}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-foreground/50 text-lg font-bold">
                      #{index + 1}
                    </span>
                    <span className="font-medium">
                      {participant.player?.name}
                    </span>
                  </div>
                  <span className="text-lg font-semibold">
                    {participant.currentPoints} pts
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  const activeParticipants = game.participants.filter((p) => !p.isEliminated)

  return (
    <div className="space-y-6">
      {/* Current Round */}
      {currentRound ? (
        <div className="rounded-lg border p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-foreground text-2xl font-bold">
              Round {currentRound.roundNumber}
            </h2>
            <div className="flex space-x-3">
              {currentRound.eliminations.length > 0 &&
                currentRound.status === 'active' && (
                  <Button onClick={handleRevertElimination} variant="outline">
                    Revert Last Elimination
                  </Button>
                )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-center text-lg">
              <span className="text-foreground/70">Serve: </span>
              <span className="font-semibold">
                {
                  currentRound.players.find(
                    (p) => p._id === currentRound.serverId,
                  )?.name
                }
              </span>
            </p>
          </div>

          {/* Playing Field */}
          <GamePlayingField
            players={currentRound.players || []}
            serverId={currentRound.serverId}
            onPlayerEliminate={handleEliminatePlayer}
            disabled={currentRound.status === 'completed'}
          />
          {currentRound.status === 'completed' && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-center font-medium text-green-800">
                🎉 Round Complete! Winner:{' '}
                {
                  currentRound.players.find(
                    (p) => p._id === currentRound.winner,
                  )?.name
                }
              </p>
              <p className="mt-1 text-center text-sm text-green-700">
                Starting next round automatically...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-6 text-center shadow-sm">
          <h2 className="text-foreground mb-4 text-2xl font-bold">
            Ready to start?
          </h2>
          <p className="text-foreground/70 mb-6">
            {activeParticipants.length} players ready to play
          </p>
          <Button
            onClick={handleStartNewRound}
            disabled={activeParticipants.length < 2}
          >
            Start new round
          </Button>
        </div>
      )}
      {/* Game Header */}
      <div className="grid grid-cols-2 items-start gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{game.name}</span>
              <StatusIndicator status={game.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg">Points to win: {game.winningPoints}</div>
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
              {game.participants
                .sort((a, b) => b.currentPoints - a.currentPoints)
                .map((participant) => (
                  <TableRow key={participant.playerId}>
                    <TableCell className="font-semibold" align="right">
                      {participant.player?.name}
                    </TableCell>
                    <TableCell className="text-primary pr-1 pl-2 font-bold">
                      {participant.currentPoints}
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
