import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import PlayerSelector from './PlayerSelector'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'

interface LeagueSetupProps {
  onLeagueCreated: (leagueId: Id<'leagues'>) => void
}

export function LeagueSetup({ onLeagueCreated }: LeagueSetupProps) {
  const players = useQuery(api.players.list) || []
  const leagues = useQuery(api.leagues.list) || []
  const createLeague = useMutation(api.leagues.create)

  const [leagueName, setLeagueName] = useState('')
  const [playersPerHeat, setPlayersPerHeat] = useState(4)
  const [setsPerHeat, setSetsPerHeat] = useState(3)
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

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leagueName.trim() || selectedPlayerIds.length < 2) {
      toast.error('League name and at least 2 players are required')
      return
    }

    setIsCreating(true)
    try {
      const leagueId = await createLeague({
        name: leagueName.trim(),
        playersPerHeat,
        setsPerHeat,
        playerIds: selectedPlayerIds,
      })

      toast.success('League created successfully!')
      onLeagueCreated(leagueId)
    } catch (error) {
      toast.error('Failed to create league')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New League */}
      <form onSubmit={handleCreateLeague} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create new league</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground/70 mb-2 block text-sm font-medium">
                League Name
              </Label>
              <Input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Enter league name"
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground/70 mb-2 block text-sm font-medium">
                  Players per Heat
                </Label>
                <Input
                  type="number"
                  min="2"
                  max="8"
                  value={playersPerHeat}
                  onChange={(e) =>
                    setPlayersPerHeat(parseInt(e.target.value) || 2)
                  }
                  disabled={isCreating}
                />
              </div>

              <div>
                <Label className="text-foreground/70 mb-2 block text-sm font-medium">
                  Sets per Heat
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={setsPerHeat}
                  onChange={(e) =>
                    setSetsPerHeat(parseInt(e.target.value) || 1)
                  }
                  disabled={isCreating}
                />
              </div>
            </div>

            <PlayerSelector
              players={players}
              selectedPlayerIds={selectedPlayerIds}
              handlePlayerToggle={handlePlayerToggle}
              isCreating={isCreating}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={
                isCreating || !leagueName.trim() || selectedPlayerIds.length < 2
              }
              variant="outline"
            >
              {isCreating ? 'Creating League...' : 'Create League'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Existing Leagues */}
      <div className="rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-4 text-2xl font-bold">
          Recent Leagues
        </h2>

        <div className="space-y-3">
          {leagues.slice(0, 5).map((league) => (
            <div
              key={league._id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
            >
              <div>
                <h3 className="text-foreground font-medium">{league.name}</h3>
                <p className="text-foreground/70 text-sm">
                  {league.playersPerHeat} players per heat •{' '}
                  {league.setsPerHeat} sets per heat • Status: {league.status}
                </p>
              </div>
              <Button onClick={() => onLeagueCreated(league._id)}>
                {league.status === 'setup' ? 'Manage' : 'View'}
              </Button>
            </div>
          ))}
        </div>

        {leagues.length === 0 && (
          <div className="text-foreground/50 py-8 text-center">
            No leagues created yet. Create your first league above!
          </div>
        )}
      </div>
    </div>
  )
}
