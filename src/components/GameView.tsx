import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useEffect } from 'react'

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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (game.status === 'completed') {
    const winner = game.participants.find((p) => p.playerId === game.winner)
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          🏆 Game Complete!
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {winner?.player?.name} Wins!
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Final Score: {winner?.currentPoints} / {game.winningPoints} points
        </p>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Final Standings
          </h3>
          <div className="space-y-2">
            {game.participants
              .sort((a, b) => b.currentPoints - a.currentPoints)
              .map((participant, index) => (
                <div
                  key={participant.playerId}
                  className="flex justify-between items-center p-3 bg-white rounded border"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-500">
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
      {/* Game Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{game.name}</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              First to {game.winningPoints} points
            </p>
            <p className="text-sm text-gray-600">Status: {game.status}</p>
          </div>
        </div>

        {/* Current Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {game.participants
            .sort((a, b) => b.currentPoints - a.currentPoints)
            .map((participant) => (
              <div
                key={participant.playerId}
                className={`p-4 rounded-lg border-2 ${
                  participant.isEliminated
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <h3 className="font-semibold text-gray-900">
                  {participant.player?.name}
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  <span className="text-sm text-gray-600">Points:</span>{' '}
                  {participant.currentPoints}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="text-sm text-gray-600">Eliminations:</span>{' '}
                  {participant.totalEliminations}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Current Round */}
      {currentRound ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Round {currentRound.roundNumber}
            </h2>
            <div className="flex space-x-3">
              {currentRound.eliminations.length > 0 &&
                currentRound.status === 'active' && (
                  <button
                    onClick={handleRevertElimination}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Revert Last Elimination
                  </button>
                )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-lg text-gray-700 text-center">
              <span className="font-semibold">Server:</span>{' '}
              {
                currentRound.players.find(
                  (p) => p._id === currentRound.serverId
                )?.name
              }
            </p>
          </div>

          {/* Horizontal Player Layout */}
          <div className="relative">
            {/* Playing field visualization */}
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-8 mb-6">
              <div className="flex justify-center items-center min-h-[120px] gap-4 flex-row-reverse">
                {currentRound.players?.map((player, index) => {
                  if (!player?._id) return null
                  const isServer = player._id === currentRound.serverId

                  return (
                    <div
                      key={player._id}
                      className={`flex flex-col items-center space-y-3 ${
                        currentRound.players.length > 4 ? 'flex-1' : ''
                      }`}
                      style={{
                        minWidth:
                          currentRound.players.length > 4 ? 'auto' : '150px',
                      }}
                    >
                      {/* Player Card */}
                      <div
                        className={`p-4 rounded-lg border-2 transition-all w-full max-w-[150px] ${
                          isServer
                            ? 'bg-green-200 border-green-500'
                            : 'bg-white border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-center mb-2">
                          <div className="flex justify-center items-center mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {player.name}
                            </h3>
                            {isServer && (
                              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                S
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">
                            {player.currentPoints} pts
                          </p>
                        </div>

                        {currentRound.status === 'active' && player._id && (
                          <button
                            onClick={() => handleEliminatePlayer(player._id!)}
                            className="w-full px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                          >
                            Eliminate
                          </button>
                        )}
                      </div>

                      {/* Position indicator */}
                      <div className="text-xs text-gray-500 font-medium">
                        Position {index + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          {currentRound.status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium text-center">
                🎉 Round Complete! Winner:{' '}
                {
                  currentRound.players.find(
                    (p) => p._id === currentRound.winner
                  )?.name
                }
              </p>
              <p className="text-green-700 text-sm text-center mt-1">
                Starting next round automatically...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-600 mb-6">
            {activeParticipants.length} players ready to play
          </p>
          <button
            onClick={handleStartNewRound}
            disabled={activeParticipants.length < 2}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Start New Round
          </button>
        </div>
      )}
    </div>
  )
}
