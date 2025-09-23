import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { SimpleUserAvatar } from './UserAvatar'

export function PlayerPool() {
  const players = useQuery(api.players.list) || []
  const createPlayer = useMutation(api.players.create)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    setIsCreating(true)
    try {
      await createPlayer({ name: newPlayerName.trim() })
      setNewPlayerName('')
      toast.success('Player added successfully!')
    } catch (error) {
      toast.error('Failed to add player')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-2xl font-bold">Player Pool</h2>

        <form onSubmit={handleCreatePlayer} className="mb-6">
          <div className="flex gap-3">
            <Input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              disabled={isCreating}
            />
            <Button
              type="submit"
              disabled={isCreating || !newPlayerName.trim()}
            >
              {isCreating ? 'Adding...' : 'Add Player'}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <div key={player._id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center space-x-3">
                <SimpleUserAvatar userId={player._id} size="md" />
                <h3 className="text-foreground font-semibold">{player.name}</h3>
              </div>
              <div className="text-foreground/70 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Games Won:</span>
                  <span className="font-medium">{player.totalWins}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-medium">{player.totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eliminations:</span>
                  <span className="font-medium">
                    {player.totalEliminations}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-foreground/50 py-8 text-center">
            No players added yet. Add your first player above!
          </div>
        )}
      </div>
    </div>
  )
}
