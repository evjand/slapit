import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SimpleUserAvatar } from './UserAvatar'
import { Table, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import StatusIndicator from './StatusIndicator'
import { GamePlayingField } from './PlayingField'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  ArrowLeft,
  UserPlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AddPlayersToGame } from './AddPlayersToGame'

interface GameViewProps {
  gameId: Id<'games'>
}

export function GameView({ gameId }: GameViewProps) {
  const game = useQuery(api.games.get, { gameId })
  const currentRound = useQuery(api.rounds.getCurrentRound, { gameId })
  const startNewRound = useMutation(api.rounds.startNewRound)
  const eliminatePlayer = useMutation(api.rounds.eliminatePlayer)
  const revertLastElimination = useMutation(api.rounds.revertLastElimination)
  const createAndStartGame = useMutation(api.games.createAndStartGame)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isCreatingNewGame, setIsCreatingNewGame] = useState(false)
  const [showAddPlayers, setShowAddPlayers] = useState(false)
  const navigate = useNavigate()

  // Auto-start next round when current round is completed
  useEffect(() => {
    if (currentRound?.status === 'completed' && game?.status === 'active') {
      const timer = setTimeout(() => {
        handleStartNewRound()
      }, 2000) // 2 second delay to show the completion message

      return () => clearTimeout(timer)
    }
  }, [currentRound?.status, game?.status])

  // Keyboard shortcuts for focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle focus mode with F key
      if (event.key === 'f' || event.key === 'F') {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          setIsFocusMode(!isFocusMode)
        }
      }
      // Exit focus mode with Escape key
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode])

  const handleStartNewRound = async () => {
    try {
      await startNewRound({ gameId })
      toast.success('New round started!')
    } catch (error) {
      toast.error('Failed to start new round')
    }
  }

  const handleNewGameWithSamePlayers = async () => {
    if (!game) return

    setIsCreatingNewGame(true)
    try {
      const playerIds = game.participants.map((p) => p.playerId)
      const newGameId = await createAndStartGame({
        name: `${game.name} (Rematch)`,
        winningPoints: game.winningPoints,
        playerIds,
      })

      toast.success('New game created and started!')
      navigate(`/game/${newGameId}`)
    } catch (error) {
      toast.error('Failed to create new game')
    } finally {
      setIsCreatingNewGame(false)
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
      // toast.success('Player eliminated!')
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

        <div className="mt-8 flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-foreground/70 mb-4 text-sm">
              Want to play again with the same players?
            </p>
            <Button
              onClick={handleNewGameWithSamePlayers}
              disabled={isCreatingNewGame}
              size="lg"
              className="px-8 py-3"
            >
              <Play className="mr-2 h-5 w-5" />
              {isCreatingNewGame ? 'Creating...' : 'New Game with Same Players'}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/games')}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </div>
      </div>
    )
  }

  const activeParticipants = game.participants.filter((p) => !p.isEliminated)

  // Focus mode layout - maximizes playing field visibility
  if (isFocusMode) {
    return (
      <div className="bg-background fixed inset-0 z-50">
        {/* Focus mode header */}
        <div className="absolute top-6 right-6 left-6 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-foreground text-4xl font-bold">{game.name}</h1>
            <StatusIndicator status={game.status} size="lg" />
            {currentRound && (
              <span className="text-foreground/70 text-2xl">
                Round {currentRound.roundNumber}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowAddPlayers(true)}
              variant="outline"
              size="lg"
              title="Add players to this game"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Add Players
            </Button>
            {currentRound?.eliminations &&
              currentRound.eliminations.length > 0 &&
              currentRound.status === 'active' && (
                <Button
                  onClick={handleRevertElimination}
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Revert
                </Button>
              )}
            <Button
              onClick={() => setIsFocusMode(false)}
              variant="outline"
              size="lg"
              title="Exit focus mode (Escape)"
            >
              <Minimize2 className="mr-2 h-5 w-5" />
              Exit Focus
            </Button>
          </div>
        </div>

        {/* Server indicator */}
        {currentRound && (
          <div className="absolute top-24 left-1/2 z-10 -translate-x-1/2 transform">
            <div className="bg-background/90 rounded-xl border-2 px-8 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-center text-2xl">
                <span className="text-foreground/70 mr-4">Serve: </span>
                <SimpleUserAvatar
                  userId={currentRound.serverId as Id<'players'>}
                  size="md"
                  imageStorageId={
                    currentRound.players.find(
                      (p) => p._id === currentRound.serverId,
                    )?.imageStorageId
                  }
                  initials={
                    currentRound.players.find(
                      (p) => p._id === currentRound.serverId,
                    )?.initials
                  }
                  name={
                    currentRound.players.find(
                      (p) => p._id === currentRound.serverId,
                    )?.name
                  }
                />
                <span className="font-bold">
                  {
                    currentRound.players.find(
                      (p) => p._id === currentRound.serverId,
                    )?.name
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Large playing field */}
        <div className="flex h-full items-center justify-center pt-32 pb-12">
          {currentRound ? (
            <div className="w-full">
              <GamePlayingField
                players={currentRound.players || []}
                serverId={currentRound.serverId}
                onPlayerEliminate={handleEliminatePlayer}
                disabled={currentRound.status === 'completed'}
                className="!p-4"
                avatarSize={
                  currentRound.players && currentRound.players.length > 6
                    ? 'xl'
                    : '2xl'
                }
              />
              {currentRound.status === 'completed' && (
                <div className="mt-12 rounded-xl border-2 border-green-200 bg-green-50 p-8 text-center">
                  <p className="text-3xl font-bold text-green-800">
                    🎉 Round Complete! Winner:{' '}
                    {
                      currentRound.players.find(
                        (p) => p._id === currentRound.winner,
                      )?.name
                    }
                  </p>
                  <p className="mt-4 text-2xl text-green-700">
                    Starting next round automatically...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-foreground mb-8 text-6xl font-bold">
                Ready to start?
              </h2>
              <p className="text-foreground/70 mb-12 text-3xl">
                {activeParticipants.length} players ready to play
              </p>
              <Button
                onClick={handleStartNewRound}
                disabled={activeParticipants.length < 2}
                size="lg"
                className="px-12 py-6 text-xl"
              >
                Start new round
              </Button>
            </div>
          )}
        </div>

        {/* Bottom scores overlay */}
        <div className="absolute right-6 bottom-6 left-6 z-10">
          <div className="bg-background/90 rounded-xl border-2 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-8 overflow-auto">
              {game.participants
                .sort((a, b) => b.currentPoints - a.currentPoints)
                .map((participant) => (
                  <div
                    key={participant.playerId}
                    className="flex items-center space-x-4"
                  >
                    <SimpleUserAvatar
                      userId={participant.playerId}
                      size="sm"
                      imageStorageId={participant.player?.imageStorageId}
                      initials={participant.player?.initials}
                      name={participant.player?.name}
                    />
                    <div className="flex gap-2">
                      <span className="text-lg font-bold">
                        {participant.player?.name}
                      </span>
                      <span className="text-primary text-lg font-bold">
                        {participant.currentPoints}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Add Players Dialog */}
        {showAddPlayers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <AddPlayersToGame
              gameId={gameId}
              currentPlayerIds={game?.participants.map((p) => p.playerId) || []}
              onClose={() => setShowAddPlayers(false)}
            />
          </div>
        )}
      </div>
    )
  }

  // Normal mode layout
  return (
    <div className="space-y-6">
      {/* Game controls */}
      <div className="flex justify-end space-x-2">
        <Button
          onClick={() => setShowAddPlayers(true)}
          variant="outline"
          size="sm"
          title="Add players to this game"
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Add Players
        </Button>
        <Button
          onClick={() => setIsFocusMode(true)}
          variant="outline"
          size="sm"
          title="Enter focus mode (Ctrl+F or Cmd+F)"
        >
          <Maximize2 className="mr-1 h-4 w-4" />
          Focus Mode
        </Button>
      </div>

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

      {/* Add Players Dialog */}
      {showAddPlayers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <AddPlayersToGame
            gameId={gameId}
            currentPlayerIds={game?.participants.map((p) => p.playerId) || []}
            onClose={() => setShowAddPlayers(false)}
          />
        </div>
      )}
    </div>
  )
}
