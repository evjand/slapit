import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'

interface GameSetupProps {
  onGameCreated: (gameId: Id<'games'>) => void
}

export function GameSetup({ onGameCreated }: GameSetupProps) {
  const players = useQuery(api.players.list) || []
  const games = useQuery(api.games.list) || []
  const createGame = useMutation(api.games.create)
  const startGame = useMutation(api.games.startGame)

  const [winningPoints, setWinningPoints] = useState(2)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Id<'players'>[]>(
    []
  )
  const [isCreating, setIsCreating] = useState(false)

  const handlePlayerToggle = (playerId: Id<'players'>) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    )
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPlayerIds.length < 2) {
      toast.error('At least 2 players are required')
      return
    }

    setIsCreating(true)
    try {
      const gameId = await createGame({
        name: new Date().toLocaleString('nb-NO', {
          dateStyle: 'medium',
          timeStyle: 'medium',
        }),
        winningPoints,
        playerIds: selectedPlayerIds,
      })

      await startGame({ gameId })

      toast.success('Game created successfully!')
      onGameCreated(gameId)
    } catch (error) {
      toast.error('Failed to create game', {
        description: (error as Error).message,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartExistingGame = async (gameId: Id<'games'>) => {
    try {
      await startGame({ gameId })
      onGameCreated(gameId)
      toast.success('Game started!')
    } catch (error) {
      toast.error('Failed to start game')
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Game */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create New Game
        </h2>

        <form onSubmit={handleCreateGame} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points to Win
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={winningPoints}
              onChange={(e) => setWinningPoints(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Players ({selectedPlayerIds.length} selected)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {players.map((player) => (
                <label
                  key={player._id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(player._id)}
                    onChange={() => handlePlayerToggle(player._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                  <span className="text-sm">{player.name}</span>
                </label>
              ))}
            </div>
            {players.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No players available. Add players in the Player Pool first.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isCreating || selectedPlayerIds.length < 2}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isCreating ? 'Creating Game...' : 'Create & Start Game'}
          </button>
        </form>
      </div>

      {/* Existing Games */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Games</h2>

        <div className="space-y-3">
          {games.slice(0, 5).map((game) => (
            <div
              key={game._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div>
                <h3 className="font-medium text-gray-900">{game.name}</h3>
                <p className="text-sm text-gray-600">
                  First to {game.winningPoints} points • Status: {game.status}
                </p>
              </div>
              {game.status === 'setup' && (
                <button
                  onClick={() => handleStartExistingGame(game._id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start Game
                </button>
              )}
              {game.status === 'active' && (
                <button
                  onClick={() => onGameCreated(game._id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Continue
                </button>
              )}
              {game.status === 'completed' && (
                <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                  Completed
                </span>
              )}
            </div>
          ))}
        </div>

        {games.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No games created yet. Create your first game above!
          </div>
        )}
      </div>
    </div>
  )
}
