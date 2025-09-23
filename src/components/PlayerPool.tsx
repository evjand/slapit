import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { PlayerCard } from './PlayerCard'
import { Button } from './ui/button'
import { Input } from './ui/input'

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

  // Sort players by wins (descending) then total points (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.totalWins !== b.totalWins) {
      return b.totalWins - a.totalWins
    }
    return b.totalPoints - a.totalPoints
  })

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sortedPlayers.map((player) => (
            <PlayerCard key={player._id} player={player} />
          ))}
        </div>

        {sortedPlayers.length === 0 && (
          <div className="text-foreground/50 py-8 text-center">
            No players added yet. Add your first player above!
          </div>
        )}
      </div>
    </div>
  )
}
