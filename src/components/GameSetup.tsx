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
  const createAndStartGame = useMutation(api.games.createAndStartGame)

  const [winningPoints, setWinningPoints] = useState(2)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Id<'players'>[]>(
    [],
  )
  const [trackAnalytics, setTrackAnalytics] = useState(true)
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
      const gameId = await createAndStartGame({
        name: new Date().toLocaleString('nb-NO', {
          dateStyle: 'medium',
          timeStyle: 'medium',
        }),
        winningPoints,
        playerIds: selectedPlayerIds,
        trackAnalytics,
      })

      toast.success('Game created and started!')
      onGameCreated(gameId)
    } catch (error) {
      toast.error('Failed to create game', {
        description: (error as Error).message,
      })
    } finally {
      setIsCreating(false)
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trackAnalytics"
              checked={trackAnalytics}
              onCheckedChange={(checked) => setTrackAnalytics(!!checked)}
              disabled={isCreating}
            />
            <Label
              htmlFor="trackAnalytics"
              className="text-foreground/70 text-sm font-medium"
            >
              Track wins and points (disable for testing)
            </Label>
          </div>

          <div>
            <Label className="text-foreground/70 mb-2 block text-sm font-medium">
              Select Players ({selectedPlayerIds.length} selected)
            </Label>
            <div className="flex flex-wrap gap-2">
              {players.map((player) => (
                <Label
                  key={player._id}
                  className={cn(
                    'border-input hover:bg-accent flex cursor-pointer items-center space-x-3 rounded-lg border p-4',
                    selectedPlayerIds.includes(player._id) &&
                      'border-green-500 bg-green-100 dark:border-green-600 dark:bg-green-900',
                  )}
                >
                  <Checkbox
                    checked={selectedPlayerIds.includes(player._id)}
                    onCheckedChange={() => handlePlayerToggle(player._id)}
                    disabled={isCreating}
                  />

                  <span className="text-base">{player.name}</span>
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
    </div>
  )
}
