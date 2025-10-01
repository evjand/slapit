import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import PageWrapper from '../components/PageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  GamepadIcon,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Id } from '../../convex/_generated/dataModel'

export function PlayerDetailRoute() {
  const { playerId } = useParams<{ playerId: string }>()

  if (!playerId) {
    return <div>Player not found</div>
  }

  const player = useQuery(api.players.get, {
    playerId: playerId as Id<'players'>,
  })
  const eloRating = useQuery(api.elo.getPlayerEloRating, {
    playerId: playerId as Id<'players'>,
  })
  const eloHistory = useQuery(api.elo.getPlayerEloHistory, {
    playerId: playerId as Id<'players'>,
  })

  if (
    player === undefined ||
    eloRating === undefined ||
    eloHistory === undefined
  ) {
    return (
      <PageWrapper>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </PageWrapper>
    )
  }

  if (!player) {
    return (
      <PageWrapper>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Player not found</h2>
          <Link to="/players">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Players
            </Button>
          </Link>
        </div>
      </PageWrapper>
    )
  }

  // Calculate performance metrics
  const winRate =
    player.totalGamesPlayed > 0
      ? (player.totalWins / player.totalGamesPlayed) * 100
      : 0
  const avgPoints =
    player.totalGamesPlayed > 0
      ? player.totalPoints / player.totalGamesPlayed
      : 0
  const avgEliminations =
    player.totalGamesPlayed > 0
      ? player.totalEliminations / player.totalGamesPlayed
      : 0

  // Prepare chart data - reverse to show chronological order
  const chartData = [...eloHistory].reverse().map((entry, index) => ({
    game: index + 1,
    rating: entry.ratingAfter,
    change: entry.ratingChange,
    date: new Date(entry._creationTime).toLocaleDateString(),
  }))

  const chartConfig = {
    rating: {
      label: 'ELO Rating',
      theme: {
        light: '#3B82F6', // Bright blue for light mode
        dark: '#06B6D4', // Cyan for dark mode
      },
    },
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/players">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Players
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{player.name}</h1>
              {player.initials && (
                <p className="text-muted-foreground">
                  Initials: {player.initials}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {eloRating && (
              <Badge variant="secondary" className="px-3 py-1 text-lg">
                ELO: {eloRating.currentRating}
              </Badge>
            )}
          </div>
        </div>

        {/* Performance Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wins</CardTitle>
              <Trophy className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{player.totalWins}</div>
              <p className="text-muted-foreground text-xs">
                {winRate.toFixed(1)}% win rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Points
              </CardTitle>
              <Target className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{player.totalPoints}</div>
              <p className="text-muted-foreground text-xs">
                {avgPoints.toFixed(1)} avg per game
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Games Played
              </CardTitle>
              <GamepadIcon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {player.totalGamesPlayed}
              </div>
              <p className="text-muted-foreground text-xs">
                {player.totalEliminations} total eliminations
              </p>
            </CardContent>
          </Card>

          {eloRating && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak ELO</CardTitle>
                <TrendingUp className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eloRating.peakRating}</div>
                <p className="text-muted-foreground text-xs">
                  Current: {eloRating.currentRating}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ELO History Chart */}
        {eloHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ELO Rating History</CardTitle>
              <p className="text-muted-foreground text-sm">
                Rating progression over the last {eloHistory.length} games
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="opacity-30"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <XAxis
                    dataKey="game"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis domain={['dataMin - 50', 'dataMax + 50']} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          `${value} ${name === 'rating' ? 'ELO' : ''}`,
                          name === 'rating' ? 'Rating' : name,
                        ]}
                        labelFormatter={(value) => `Game ${value}`}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="var(--color-rating)"
                    strokeWidth={4}
                    strokeLinecap="round"
                    connectNulls={true}
                    dot={{
                      fill: 'var(--color-rating)',
                      strokeWidth: 2,
                      r: 6,
                      stroke: 'hsl(var(--background))',
                    }}
                    activeDot={{
                      r: 8,
                      stroke: 'var(--color-rating)',
                      strokeWidth: 3,
                      fill: 'hsl(var(--background))',
                    }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Games ELO Changes */}
        {eloHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent ELO Changes</CardTitle>
              <p className="text-muted-foreground text-sm">
                Last 10 games with rating changes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eloHistory.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">
                        Game {eloHistory.length - index}
                      </Badge>
                      <span className="text-muted-foreground text-sm">
                        {new Date(entry._creationTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">
                        {entry.ratingBefore} → {entry.ratingAfter}
                      </span>
                      <Badge
                        variant={
                          entry.ratingChange >= 0 ? 'default' : 'destructive'
                        }
                      >
                        {entry.ratingChange >= 0 ? '+' : ''}
                        {entry.ratingChange}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {eloHistory.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No ELO History Yet</h3>
              <p className="text-muted-foreground text-center">
                This player hasn't completed any rated games yet. ELO rating
                will be calculated after the first game completion.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}
