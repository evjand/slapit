import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeatView } from './HeatView'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { LeagueViewProps } from '../types'

export function LeagueView({ leagueId }: LeagueViewProps) {
  const navigate = useNavigate()
  const league = useQuery(api.leagues.get, { leagueId })
  const games = useQuery(api.leagues.getHeats, { leagueId })
  const leagueTable = useQuery(api.leagues.getLeagueTable, { leagueId })
  const generateHeats = useMutation(api.leagues.generateHeats)

  const [selectedGameId, setSelectedGameId] = useState<Id<'games'> | null>(null)
  const [activeTab, setActiveTab] = useState<'games' | 'table'>('games')

  const handleGenerateHeats = async () => {
    try {
      await generateHeats({ leagueId })
      toast.success('New heats generated!')
    } catch (error) {
      toast.error('Failed to generate heats')
    }
  }

  if (!league) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (selectedGameId) {
    return (
      <HeatView
        heatId={selectedGameId}
        onBack={() => setSelectedGameId(null)}
      />
    )
  }

  const allGamesCompleted =
    games?.every((game) => game.status === 'completed') ?? false
  const hasActiveGames = games?.some((game) => game.status !== 'setup') ?? false

  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="rounded-lg border p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-foreground text-3xl font-bold">{league.name}</h1>
          <div className="text-right">
            <p className="text-foreground/70 text-sm">
              {league.playersPerHeat} players per heat • {league.setsPerHeat}{' '}
              sets per heat
            </p>
            <p className="text-foreground/70 text-sm">
              Round {league.currentRound} • Status: {league.status}
            </p>
          </div>
        </div>

        {league.status === 'setup' && (
          <Button onClick={handleGenerateHeats}>
            Generate First Round Games
          </Button>
        )}

        {league.status === 'active' && allGamesCompleted && (
          <Button onClick={handleGenerateHeats}>
            Generate Next Round Games
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="rounded-lg border shadow-sm">
        <div className="border-border border-b">
          <nav className="flex space-x-8 px-6 py-4">
            <Button
              onClick={() => setActiveTab('games')}
              variant={activeTab === 'games' ? 'default' : 'secondary'}
            >
              Current Games
            </Button>
            <Button
              onClick={() => setActiveTab('table')}
              variant={activeTab === 'table' ? 'default' : 'secondary'}
            >
              League Table
            </Button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'games' && (
            <div>
              {games && games.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {games.map((game) => (
                    <div
                      key={game._id}
                      className={cn(
                        'cursor-pointer rounded-lg border-2 p-4 transition-all',
                        game.status === 'completed'
                          ? 'bg-card'
                          : game.status === 'active'
                            ? 'bg-card border-green-500 dark:border-green-600'
                            : 'bg-card',
                      )}
                      onClick={() =>
                        navigate(`/league/${leagueId}/game/${game._id}`)
                      }
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-foreground font-semibold">
                          Game {game.heatNumber}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            game.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : game.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {game.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {game.players?.map((player) => (
                          <div
                            key={player?._id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{player?.name}</span>
                            <span className="text-foreground/70">
                              {player?.totalPoints} pts
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <p className="text-foreground/70 text-xs">
                          Sets: {game.setsCompleted} / {league.setsPerHeat}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-foreground/50 py-8 text-center">
                  {league.status === 'setup'
                    ? 'Generate games to start the league'
                    : 'No games available for current round'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'table' && (
            <div>
              {leagueTable && leagueTable.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Eliminations</TableHead>
                        <TableHead>Games Played</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leagueTable.map((participant, index) => (
                        <TableRow
                          key={participant._id}
                          className={cn(
                            index == 0 && 'bg-green-100 dark:bg-green-900',
                            index == 1 && 'bg-lime-100 dark:bg-lime-900',
                            index == 2 && 'bg-yellow-100 dark:bg-yellow-900',
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center">
                              <span className="mr-2">#{index + 1}</span>
                              {index === 0 && (
                                <span className="text-yellow-500">🥇</span>
                              )}
                              {index === 1 && (
                                <span className="text-gray-400">🥈</span>
                              )}
                              {index === 2 && (
                                <span className="text-yellow-600">🥉</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{participant.player?.name}</TableCell>
                          <TableCell>{participant.totalPoints}</TableCell>
                          <TableCell>{participant.totalEliminations}</TableCell>
                          <TableCell>{participant.gamesPlayed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-foreground/50 py-8 text-center">
                  No league data available yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
