import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { Plus, Play, Trophy } from 'lucide-react'

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ongoingGames.map((game) => (
              <Card key={game._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Game {game._id.slice(-6)}</span>
                    <span className="text-sm font-normal text-green-600">
                      Active
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      Players: {game.playerIds?.length || 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Created:{' '}
                      {new Date(game._creationTime).toLocaleDateString()}
                    </div>
                    <Link to={`/game/${game._id}`}>
                      <Button className="w-full" size="sm">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGames.map((game) => (
              <Card key={game._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Game {game._id.slice(-6)}</span>
                    <span className="text-sm font-normal text-yellow-600">
                      Completed
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      Players: {game.playerIds?.length || 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Completed:{' '}
                      {new Date(game._creationTime).toLocaleDateString()}
                    </div>
                    <Link to={`/game/${game._id}`}>
                      <Button variant="outline" className="w-full" size="sm">
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
