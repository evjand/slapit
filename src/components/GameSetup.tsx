import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { cn } from '@/lib/utils'

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
    [],
  )
  const [isCreating, setIsCreating] = useState(false)

  const handlePlayerToggle = (playerId: Id<'players'>) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
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
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-2xl font-bold">
          Create New Game
        </h2>

        <form onSubmit={handleCreateGame} className="space-y-4">
          <div>
            <Label className="text-foreground/70 mb-2 block text-sm font-medium">
              Points to Win
            </Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={winningPoints}
              onChange={(e) => setWinningPoints(parseInt(e.target.value) || 1)}
              disabled={isCreating}
            />
          </div>

          <div>
            <Label className="text-foreground/70 mb-2 block text-sm font-medium">
              Select Players ({selectedPlayerIds.length} selected)
            </Label>
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-4 lg:grid-cols-6">
              {players.map((player) => (
                <Label
                  key={player._id}
                  className={cn(
                    'border-input hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-lg border px-6 py-4',
                    selectedPlayerIds.includes(player._id) &&
                      'border-green-500 bg-green-100 dark:border-green-600 dark:bg-green-900',
                  )}
                >
                  <Checkbox
                    checked={selectedPlayerIds.includes(player._id)}
                    onCheckedChange={() => handlePlayerToggle(player._id)}
                    disabled={isCreating}
                  />

                  <span className="text-sm">{player.name}</span>
                </Label>
              ))}
            </div>
            {players.length === 0 && (
              <p className="text-foreground/50 mt-2 text-sm">
                No players available. Add players in the Player Pool first.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isCreating || selectedPlayerIds.length < 2}
          >
            {isCreating ? 'Creating Game...' : 'Create & Start Game'}
          </Button>
        </form>
      </div>

      {/* Existing Games */}
      <div className="rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-2xl font-bold">
          Recent Games
        </h2>

        <div className="space-y-3">
          {games.slice(0, 5).map((game) => (
            <div
              key={game._id}
              className="border-border flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <h3 className="text-foreground font-medium">{game.name}</h3>
                <p className="text-foreground/70 text-sm">
                  First to {game.winningPoints} points • Status: {game.status}
                </p>
              </div>
              {game.status === 'setup' && (
                <Button onClick={() => handleStartExistingGame(game._id)}>
                  Start Game
                </Button>
              )}
              {game.status === 'active' && (
                <Button onClick={() => onGameCreated(game._id)}>
                  Continue
                </Button>
              )}
              {game.status === 'completed' && (
                <span className="text-foreground/70 rounded-lg px-4 py-2">
                  Completed
                </span>
              )}
            </div>
          ))}
        </div>

        {games.length === 0 && (
          <div className="text-foreground/50 py-8 text-center">
            No games created yet. Create your first game above!
          </div>
        )}
      </div>
    </div>
  )
}
