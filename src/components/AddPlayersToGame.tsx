import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SimpleUserAvatar } from './UserAvatar'
import { Checkbox } from './ui/checkbox'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'

interface AddPlayersToGameProps {
  gameId: Id<'games'>
  currentPlayerIds: Id<'players'>[]
  onClose: () => void
}

export function AddPlayersToGame({
  gameId,
  currentPlayerIds,
  onClose,
}: AddPlayersToGameProps) {
  const players = useQuery(api.players.list) || []
  const addParticipantsToGame = useMutation(api.games.addParticipantsToGame)

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Id<'players'>[]>(
    [],
  )
  const [isAdding, setIsAdding] = useState(false)

  // Filter out players who are already in the game
  const availablePlayers = players.filter(
    (player) => !currentPlayerIds.includes(player._id),
  )

  const handlePlayerToggle = (playerId: Id<'players'>) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    )
  }

  const handleAddPlayers = async () => {
    if (selectedPlayerIds.length === 0) {
      toast.error('Please select at least one player to add')
      return
    }

    setIsAdding(true)
    try {
      await addParticipantsToGame({
        gameId,
        playerIds: selectedPlayerIds,
      })

      toast.success(`Added ${selectedPlayerIds.length} player(s) to the game!`)
      onClose()
    } catch (error) {
      toast.error('Failed to add players to game')
    } finally {
      setIsAdding(false)
    }
  }

  if (availablePlayers.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Add Players
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            All available players are already in this game.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Add Players to Game
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {availablePlayers.map((player) => (
            <div
              key={player._id}
              className="hover:bg-muted/50 flex items-center space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={player._id}
                checked={selectedPlayerIds.includes(player._id)}
                onCheckedChange={() => handlePlayerToggle(player._id)}
              />
              <SimpleUserAvatar
                userId={player._id}
                size="sm"
                imageStorageId={player.imageStorageId}
                initials={player.initials}
                name={player.name}
              />
              <label
                htmlFor={player._id}
                className="flex-1 cursor-pointer font-medium"
              >
                {player.name}
              </label>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleAddPlayers}
            disabled={isAdding || selectedPlayerIds.length === 0}
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAdding
              ? 'Adding...'
              : `Add ${selectedPlayerIds.length} Player(s)`}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
