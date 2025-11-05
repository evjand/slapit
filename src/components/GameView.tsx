import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  GameViewProps,
  Game,
  GameWithParticipants,
  GameMode,
  GAME_MODES,
  GAME_STATUSES,
} from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SimpleUserAvatar } from './UserAvatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Badge } from './ui/badge'
import { GameStatusIndicator } from './GameStatusIndicator'
import { PlayingField } from './PlayingField'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Tv,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AddPlayersToGame } from './AddPlayersToGame'
import { FullscreenVideoPlayer } from './FullscreenVideoPlayer'
import { ConfettiCelebration } from './ConfettiCelebration'

// Using GameViewProps from types/index.ts

export function GameView({ gameId, onBack }: GameViewProps) {
  const location = useLocation()
  const isLeagueGame = location.pathname.includes('/league/')
  const leagueId = isLeagueGame ? location.pathname.split('/')[2] : null

  // Game queries and mutations
  const game = useQuery(api.games.get, { gameId })
  const currentRound = useQuery(api.rounds.getCurrentRound, { gameId })
  const startNewRound = useMutation(api.rounds.startNewRound)
  const eliminatePlayer = useMutation(api.rounds.eliminatePlayer)
  const revertLastElimination = useMutation(api.rounds.revertLastElimination)
  const createAndStartGame = useMutation(api.games.createAndStartGame)
  const setTelevised = useMutation(api.games.setTelevised)
  const unsetTelevised = useMutation(api.games.unsetTelevised)
  const cancelGame = useMutation(api.games.cancelGame)
  const removeParticipantFromGame = useMutation(api.games.removeParticipantFromGame)

  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isCreatingNewGame, setIsCreatingNewGame] = useState(false)
  const [showAddPlayers, setShowAddPlayers] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<string | null>(null)
  const [showEliminationConfirm, setShowEliminationConfirm] = useState(false)
  const [playerToEliminate, setPlayerToEliminate] =
    useState<Id<'players'> | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showRemovePlayerConfirm, setShowRemovePlayerConfirm] = useState(false)
  const [playerToRemove, setPlayerToRemove] =
    useState<Id<'players'> | null>(null)
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
        gameMode: game.gameMode,
        winningPoints: game.winningPoints,
        setsPerGame: game.setsPerGame,
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

  const handleReactionVideo = (videoPath: string) => {
    setCurrentVideo(videoPath)
  }

  const handleCloseVideo = () => {
    setCurrentVideo(null)
  }

  const handleSetTelevised = async () => {
    try {
      await setTelevised({ gameId })
      toast.success('Game set to televised')
    } catch (error) {
      toast.error('Failed to set game as televised')
    }
  }

  const handleUnsetTelevised = async () => {
    try {
      await unsetTelevised({ gameId })
      toast.success('Game removed from televised')
    } catch (error) {
      toast.error('Failed to remove game from televised')
    }
  }

  const handleEliminatePlayer = async (playerId: Id<'players'>) => {
    if (!currentRound) return

    // Check if this would be the final elimination (only 2 players left)
    const remainingPlayers =
      currentRound.currentPlayerOrder?.filter((id) => id !== playerId) || []

    if (remainingPlayers.length === 1) {
      // Show confirmation dialog for final elimination
      setPlayerToEliminate(playerId)
      setShowEliminationConfirm(true)
      return
    }

    // Proceed with elimination if not the final one
    await performElimination(playerId)
  }

  const performElimination = async (playerId: Id<'players'>) => {
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

  const handleConfirmElimination = async () => {
    if (playerToEliminate) {
      await performElimination(playerToEliminate)
    }
    setShowEliminationConfirm(false)
    setPlayerToEliminate(null)
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

  const handleCancelGame = async () => {
    try {
      await cancelGame({ gameId })
      toast.success('Game cancelled')

      // Navigate back appropriately
      if (isLeagueGame && leagueId) {
        navigate(`/league/${leagueId}`)
      } else {
        navigate('/games')
      }
    } catch (error) {
      toast.error('Failed to cancel game')
    }
  }

  const handleRemovePlayer = (playerId: Id<'players'>) => {
    setPlayerToRemove(playerId)
    setShowRemovePlayerConfirm(true)
  }

  const handleConfirmRemovePlayer = async () => {
    if (!playerToRemove) return

    try {
      await removeParticipantFromGame({
        gameId,
        playerId: playerToRemove,
      })
      toast.success('Player removed from game')
      setShowRemovePlayerConfirm(false)
      setPlayerToRemove(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove player from game')
      setShowRemovePlayerConfirm(false)
      setPlayerToRemove(null)
    }
  }

  if (!game) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (game.status === 'cancelled') {
    return (
      <div className="rounded-lg border p-8 text-center shadow-sm">
        <h1 className="mb-4 text-4xl font-bold text-orange-600">
          ⚠️ Game Cancelled
        </h1>
        <p className="text-foreground/70 mb-6 text-lg">
          This game was cancelled and no stats were recorded.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            if (isLeagueGame && leagueId) {
              navigate(`/league/${leagueId}`)
            } else {
              navigate('/games')
            }
          }}
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isLeagueGame ? 'Back to League' : 'Back to Games'}
        </Button>
      </div>
    )
  }

  if (game.status === 'completed') {
    const winner = game.participants.find((p) => p.playerId === game.winner)
    return (
      <div className="relative">
        <ConfettiCelebration />
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
            {!game.leagueId && (
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
                  {isCreatingNewGame
                    ? 'Creating...'
                    : 'New Game with Same Players'}
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (isLeagueGame && leagueId) {
                  // For league games accessed through league route, go back to league
                  navigate(`/league/${leagueId}`)
                } else {
                  // For standalone games, go back to games list
                  navigate('/games')
                }
              }}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isLeagueGame ? 'Back to League' : 'Back to Games'}
            </Button>
          </div>
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
            <GameStatusIndicator status={game.status} size="lg" />
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
            {game?.isTelevised ? (
              <Button
                onClick={handleUnsetTelevised}
                variant="outline"
                size="lg"
                className="bg-red-100 text-red-800 hover:bg-red-200"
              >
                <Tv className="mr-2 h-5 w-5" />
                Stop Televising
              </Button>
            ) : (
              <Button
                onClick={handleSetTelevised}
                variant="outline"
                size="lg"
                className="bg-green-100 text-green-800 hover:bg-green-200"
              >
                <Tv className="mr-2 h-5 w-5" />
                Televise Game
              </Button>
            )}
            <Button
              onClick={() => setShowCancelConfirm(true)}
              variant="outline"
              size="lg"
              className="bg-orange-100 text-orange-800 hover:bg-orange-200"
              title="Cancel game without recording stats"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancel Game
            </Button>
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
              <PlayingField
                players={currentRound.players || []}
                serverId={currentRound.serverId}
                onPlayerClick={handleEliminatePlayer}
                showServerIndicator={true}
                showPoints={true}
                pointsLabel="pts"
                avatarSize={
                  currentRound.players && currentRound.players.length > 6
                    ? 'xl'
                    : '2xl'
                }
                layout="horizontal"
                disabled={currentRound.status === 'completed'}
                className="!p-4"
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

        {/* Reactions row */}
        <div className="absolute bottom-32 left-1/2 z-10 -translate-x-1/2 transform">
          <div className="bg-background/90 rounded-xl border-2 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <span className="text-foreground/70 text-lg font-semibold">
                Reactions:
              </span>
              <Button
                onClick={() => handleReactionVideo('/jiffed.mp4')}
                variant="outline"
                size="lg"
              >
                😂 Jiffed
              </Button>
              <Button
                onClick={() => handleReactionVideo('/skatolled.mp4')}
                variant="outline"
                size="lg"
              >
                🎯 Skatolled
              </Button>
              <Button
                onClick={() => handleReactionVideo('/pinned.mp4')}
                variant="outline"
                size="lg"
              >
                📌 Pinned
              </Button>
              <Button
                onClick={() => handleReactionVideo('/vannflasked.mp4')}
                variant="outline"
                size="lg"
              >
                🧴 Vannflasked
              </Button>
              {currentVideo}
            </div>
          </div>
        </div>

        {/* Match Ball Indicator */}
        {currentRound &&
          currentRound.currentPlayerOrder &&
          currentRound.currentPlayerOrder.length === 2 &&
          (() => {
            const playersWithMatchBall = currentRound.currentPlayerOrder
              .map((playerId) => {
                const player = currentRound.players?.find(
                  (p) => p._id === playerId,
                )
                const participant = game.participants.find(
                  (p) => p.playerId === playerId,
                )
                const isMatchBall =
                  game.gameMode === 'firstToX' &&
                  game.winningPoints &&
                  participant &&
                  participant.currentPoints >= game.winningPoints - 1
                return isMatchBall ? player?.name : null
              })
              .filter(Boolean)

            return playersWithMatchBall.length > 0 ? (
              <div className="absolute top-48 left-1/2 z-10 -translate-x-1/2 transform">
                <div className="bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-center text-sm">
                    <span className="animate-pulse text-lg">🔴</span>
                    <span className="text-primary">
                      {playersWithMatchBall.length === 1
                        ? `${playersWithMatchBall[0]} has matchball`
                        : `${playersWithMatchBall.join(' and ')} have matchball`}
                    </span>
                  </div>
                </div>
              </div>
            ) : null
          })()}

        {/* Bottom scores overlay */}
        <div className="absolute right-6 bottom-6 left-6 z-10">
          <div className="bg-background/90 rounded-xl border-2 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-8 overflow-auto">
              {game.participants
                ?.sort((a, b) => b.currentPoints - a.currentPoints)
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

        {/* Fullscreen Video Player */}
        {currentVideo && (
          <FullscreenVideoPlayer
            videoPath={currentVideo}
            onClose={handleCloseVideo}
          />
        )}

        {/* Elimination Confirmation Dialog */}
        <AlertDialog
          open={showEliminationConfirm}
          onOpenChange={setShowEliminationConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Final Elimination</AlertDialogTitle>
              <AlertDialogDescription>
                This will eliminate the following player and end the round:
              </AlertDialogDescription>
            </AlertDialogHeader>
            {playerToEliminate && (
              <div className="flex items-center justify-center py-4">
                <div className="flex flex-col items-center space-y-2">
                  <SimpleUserAvatar
                    userId={playerToEliminate}
                    name={
                      game?.participants.find(
                        (p) => p.playerId === playerToEliminate,
                      )?.player?.name || 'Unknown Player'
                    }
                    imageStorageId={
                      game?.participants.find(
                        (p) => p.playerId === playerToEliminate,
                      )?.player?.imageStorageId
                    }
                    initials={
                      game?.participants.find(
                        (p) => p.playerId === playerToEliminate,
                      )?.player?.initials
                    }
                    size="2xl"
                  />
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {game?.participants.find(
                        (p) => p.playerId === playerToEliminate,
                      )?.player?.name || 'Unknown Player'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Will be eliminated
                    </p>
                  </div>
                </div>
              </div>
            )}
            <AlertDialogDescription className="text-center">
              Are you sure you want to continue?
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setShowEliminationConfirm(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmElimination}>
                Eliminate Player
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Game Confirmation Dialog */}
        <AlertDialog
          open={showCancelConfirm}
          onOpenChange={setShowCancelConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Game</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this game?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  ⚠️ This action will cancel the game without recording any
                  stats, points, or ELO changes for any players. This cannot be
                  undone.
                </p>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>
                Keep Playing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelGame}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Cancel Game
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Players Dialog */}
        {showAddPlayers && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <AddPlayersToGame
              gameId={gameId}
              currentPlayerIds={game.participants.map((p) => p.playerId)}
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
      {/* Back button */}
      {onBack && <Button onClick={onBack}>← Back to Games</Button>}

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
        {game?.isTelevised ? (
          <Button
            onClick={handleUnsetTelevised}
            variant="outline"
            size="sm"
            title="Stop televising this game"
          >
            <Tv className="mr-1 h-4 w-4" />
            Stop Televising
          </Button>
        ) : (
          <Button
            onClick={handleSetTelevised}
            variant="outline"
            size="sm"
            title="Set this game as televised"
          >
            <Tv className="mr-1 h-4 w-4" />
            Televise Game
          </Button>
        )}
        <Button
          onClick={() => setShowCancelConfirm(true)}
          variant="outline"
          size="sm"
          className="bg-orange-100 text-orange-800 hover:bg-orange-200"
          title="Cancel game without recording stats"
        >
          <XCircle className="mr-1 h-4 w-4" />
          Cancel Game
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
              {currentRound.eliminations &&
                currentRound.eliminations.length > 0 &&
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
                  currentRound.players?.find(
                    (p) => p._id === currentRound.serverId,
                  )?.name
                }
              </span>
            </p>
          </div>

          {/* Match Ball Indicator */}
          {currentRound.currentPlayerOrder &&
            currentRound.currentPlayerOrder.length === 2 &&
            (() => {
              const playersWithMatchBall = currentRound.currentPlayerOrder
                .map((playerId) => {
                  const player = currentRound.players?.find(
                    (p) => p._id === playerId,
                  )
                  const participant = game.participants.find(
                    (p) => p.playerId === playerId,
                  )
                  const isMatchBall =
                    game.gameMode === 'firstToX' &&
                    game.winningPoints &&
                    participant &&
                    participant.currentPoints >= game.winningPoints - 1
                  return isMatchBall ? player?.name : null
                })
                .filter(Boolean)

              return playersWithMatchBall.length > 0 ? (
                <div className="mb-4">
                  <div className="bg-background/80 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 text-center text-sm">
                      <span className="animate-pulse text-lg">🔴</span>
                      <span className="text-primary">
                        {playersWithMatchBall.length === 1
                          ? `${playersWithMatchBall[0]} has matchball`
                          : `${playersWithMatchBall.join(' and ')} have matchball`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null
            })()}

          {/* Playing Field */}
          <PlayingField
            players={currentRound.players || []}
            serverId={currentRound.serverId}
            onPlayerClick={handleEliminatePlayer}
            showServerIndicator={true}
            showPoints={true}
            pointsLabel="pts"
            layout="horizontal"
            disabled={currentRound.status === 'completed'}
          />
          {currentRound.status === 'completed' && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-center font-medium text-green-800">
                🎉 Round Complete! Winner:{' '}
                {
                  currentRound.players?.find(
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
              <GameStatusIndicator status={game.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg">
              {game.gameMode === 'firstToX'
                ? `Points to win: ${game.winningPoints}`
                : `Sets: ${game.setsCompleted} / ${game.setsPerGame}`}
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
                  {game.status === 'active' && (
                    <TableHead className="w-[100px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {game.participants
                  .sort((a, b) => b.currentPoints - a.currentPoints)
                  .map((participant) => (
                    <TableRow key={participant.playerId}>
                      <TableCell className="font-semibold" align="right">
                        <div className="flex items-center justify-end gap-2">
                          {participant.isEliminated && (
                            <Badge variant="secondary" className="text-xs">
                              Out
                            </Badge>
                          )}
                          <span>{participant.player?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary pr-1 pl-2 font-bold">
                        {participant.currentPoints}
                      </TableCell>
                      {game.status === 'active' && (
                        <TableCell>
                          {!participant.isEliminated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePlayer(participant.playerId)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Remove player from game"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Players Dialog */}
      {showAddPlayers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <AddPlayersToGame
            gameId={gameId}
            currentPlayerIds={game.participants.map((p) => p.playerId)}
            onClose={() => setShowAddPlayers(false)}
          />
        </div>
      )}

      {/* Fullscreen Video Player */}
      {currentVideo && (
        <FullscreenVideoPlayer
          videoPath={currentVideo}
          onClose={handleCloseVideo}
        />
      )}

      {/* Elimination Confirmation Dialog */}
      <AlertDialog
        open={showEliminationConfirm}
        onOpenChange={setShowEliminationConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final Elimination</AlertDialogTitle>
            <AlertDialogDescription>
              This will eliminate the following player and end the round:
            </AlertDialogDescription>
          </AlertDialogHeader>
          {playerToEliminate && (
            <div className="flex items-center justify-center py-4">
              <div className="flex flex-col items-center space-y-2">
                <SimpleUserAvatar
                  userId={playerToEliminate}
                  name={
                    game?.participants.find(
                      (p) => p.playerId === playerToEliminate,
                    )?.player?.name || 'Unknown Player'
                  }
                  imageStorageId={
                    game?.participants.find(
                      (p) => p.playerId === playerToEliminate,
                    )?.player?.imageStorageId
                  }
                  initials={
                    game?.participants.find(
                      (p) => p.playerId === playerToEliminate,
                    )?.player?.initials
                  }
                  size="2xl"
                />
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {game?.participants.find(
                      (p) => p.playerId === playerToEliminate,
                    )?.player?.name || 'Unknown Player'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Will be eliminated
                  </p>
                </div>
              </div>
            </div>
          )}
          <AlertDialogDescription className="text-center">
            Are you sure you want to continue?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEliminationConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmElimination}>
              Eliminate Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Game Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Game</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this game?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                ⚠️ This action will cancel the game without recording any stats,
                points, or ELO changes for any players. This cannot be undone.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>
              Keep Playing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelGame}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Cancel Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Player Confirmation Dialog */}
      <AlertDialog
        open={showRemovePlayerConfirm}
        onOpenChange={setShowRemovePlayerConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this player from the game?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {playerToRemove && (
            <div className="flex items-center justify-center py-4">
              <div className="flex flex-col items-center space-y-2">
                <SimpleUserAvatar
                  userId={playerToRemove}
                  name={
                    game?.participants.find(
                      (p) => p.playerId === playerToRemove,
                    )?.player?.name || 'Unknown Player'
                  }
                  imageStorageId={
                    game?.participants.find(
                      (p) => p.playerId === playerToRemove,
                    )?.player?.imageStorageId
                  }
                  initials={
                    game?.participants.find(
                      (p) => p.playerId === playerToRemove,
                    )?.player?.initials
                  }
                  size="2xl"
                />
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {game?.participants.find(
                      (p) => p.playerId === playerToRemove,
                    )?.player?.name || 'Unknown Player'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Will be removed from the game
                  </p>
                </div>
              </div>
            </div>
          )}
          <AlertDialogDescription className="text-center">
            {currentRound &&
            currentRound.status === 'active' &&
            currentRound.currentPlayerOrder?.includes(playerToRemove || '') ? (
              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This player is in the current round. They will be removed
                  immediately if no eliminations have occurred yet.
                </p>
              </div>
            ) : (
              'This action cannot be undone.'
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRemovePlayerConfirm(false)
                setPlayerToRemove(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemovePlayer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
