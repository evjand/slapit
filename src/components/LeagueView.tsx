import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Id } from '../../convex/_generated/dataModel'
import { useState } from 'react'
import { HeatView } from './HeatView'
import { Button } from './ui/button'

interface LeagueViewProps {
  leagueId: Id<'leagues'>
}

export function LeagueView({ leagueId }: LeagueViewProps) {
  const league = useQuery(api.leagues.get, { leagueId })
  const heats = useQuery(api.leagues.getHeats, { leagueId })
  const leagueTable = useQuery(api.leagues.getLeagueTable, { leagueId })
  const generateHeats = useMutation(api.leagues.generateHeats)

  const [selectedHeatId, setSelectedHeatId] = useState<Id<'heats'> | null>(null)
  const [activeTab, setActiveTab] = useState<'heats' | 'table'>('heats')

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

  if (selectedHeatId) {
    return (
      <HeatView
        heatId={selectedHeatId}
        onBack={() => setSelectedHeatId(null)}
      />
    )
  }

  const allHeatsCompleted =
    heats?.every((heat) => heat.status === 'completed') ?? false
  const hasActiveHeats =
    heats?.some((heat) => heat.status !== 'pending') ?? false

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
            Generate First Round Heats
          </Button>
        )}

        {league.status === 'active' && allHeatsCompleted && (
          <Button onClick={handleGenerateHeats}>
            Generate Next Round Heats
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="rounded-lg border shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <Button
              onClick={() => setActiveTab('heats')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'heats'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:text-foreground/70 text-foreground/50 border-transparent hover:border-gray-300'
              }`}
            >
              Current Heats
            </Button>
            <Button
              onClick={() => setActiveTab('table')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'table'
                  ? 'border-blue-500 text-blue-600'
                  : 'hover:text-foreground/70 text-foreground/50 border-transparent hover:border-gray-300'
              }`}
            >
              League Table
            </Button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'heats' && (
            <div>
              {heats && heats.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {heats.map((heat) => (
                    <div
                      key={heat._id}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        heat.status === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : heat.status === 'active'
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedHeatId(heat._id)}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-foreground font-semibold">
                          Heat {heat.heatNumber}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            heat.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : heat.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {heat.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {heat.players?.map((player) => (
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
                          Sets: {heat.setsCompleted} / {league.setsPerHeat}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-foreground/50 py-8 text-center">
                  {league.status === 'setup'
                    ? 'Generate heats to start the league'
                    : 'No heats available for current round'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'table' && (
            <div>
              {leagueTable && leagueTable.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-foreground/50 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Position
                        </th>
                        <th className="text-foreground/50 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Player
                        </th>
                        <th className="text-foreground/50 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Points
                        </th>
                        <th className="text-foreground/50 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Eliminations
                        </th>
                        <th className="text-foreground/50 px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Games Played
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {leagueTable.map((participant, index) => (
                        <tr
                          key={participant._id}
                          className={index < 3 ? 'bg-yellow-50' : ''}
                        >
                          <td className="text-foreground px-6 py-4 text-sm font-medium whitespace-nowrap">
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
                          </td>
                          <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                            {participant.player?.name}
                          </td>
                          <td className="text-foreground px-6 py-4 text-sm font-semibold whitespace-nowrap">
                            {participant.totalPoints}
                          </td>
                          <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                            {participant.totalEliminations}
                          </td>
                          <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">
                            {participant.gamesPlayed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
