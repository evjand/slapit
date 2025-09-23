import { cn } from '@/lib/utils'
import { Id } from '../../convex/_generated/dataModel'
import { GamePlayer } from '../../convex/gameEngine'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'

export default function PlayerSelector({
  players,
  selectedPlayerIds,
  handlePlayerToggle,
  isCreating,
}: {
  players: GamePlayer[]
  selectedPlayerIds: Id<'players'>[]
  handlePlayerToggle: (playerId: Id<'players'>) => void
  isCreating: boolean
}) {
  return (
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
  )
}
