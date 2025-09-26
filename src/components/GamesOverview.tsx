import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { Plus, Play, Trophy, Calendar, Users } from 'lucide-react'
import { GameStatusIndicator } from './GameStatusIndicator'

export function GamesOverview() {
  const games = useQuery(api.games.list) || []

  // Separate ongoing and completed games
  const ongoingGames = games.filter((game) => game.status === 'active')
  const completedGames = games.filter((game) => game.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Games</h1>
        <Link to="/">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Game
          </Button>
        </Link>
      </div>

      {/* Ongoing Games Section */}
      <div>
        <h2 className="mb-4 flex items-center text-2xl font-semibold">
          <Play className="mr-2 h-5 w-5 text-green-500" />
          Ongoing Games
        </h2>
        {ongoingGames.length > 0 ? (
          <div className="space-y-3">
            {ongoingGames.map((game) => (
              <Card key={game._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{game.name}</h3>
                        <GameStatusIndicator status={game.status} />
                      </div>
                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{game.participants?.length || 0} players</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(game._creationTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/game/${game._id}`}>
                      <Button size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Continue Game
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              No ongoing games. Create a new game to get started!
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Games Section */}
      <div>
        <h2 className="mb-4 flex items-center text-2xl font-semibold">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Completed Games
        </h2>
        {completedGames.length > 0 ? (
          <div className="space-y-3">
            {completedGames.map((game) => (
              <Card key={game._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{game.name}</h3>
                        <GameStatusIndicator status={game.status} />
                      </div>
                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{game.participants?.length || 0} players</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Completed{' '}
                            {new Date(game._creationTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/game/${game._id}`}>
                      <Button variant="outline" size="sm">
                        <Trophy className="mr-2 h-4 w-4" />
                        View Results
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center">
              No completed games yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
