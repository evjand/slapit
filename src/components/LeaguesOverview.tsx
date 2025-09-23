import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { Plus, Users, Trophy } from 'lucide-react'

export function LeaguesOverview() {
  const leagues = useQuery(api.leagues.list) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leagues</h1>
        <Link to="/leagues/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New League
          </Button>
        </Link>
      </div>

      {leagues.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Card key={league._id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  {league.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center text-sm">
                    <Users className="mr-1 h-4 w-4" />
                    Players: {league.playerIds?.length || 0}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Created:{' '}
                    {new Date(league._creationTime).toLocaleDateString()}
                  </div>
                  {league.description && (
                    <div className="text-muted-foreground text-sm">
                      {league.description}
                    </div>
                  )}
                  <Link to={`/league/${league._id}`}>
                    <Button className="w-full" size="sm">
                      View League
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
            <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="mb-2 text-lg font-semibold">No leagues yet</h3>
            <p className="mb-4">
              Create your first league to organize tournaments and track player
              progress.
            </p>
            <Link to="/leagues/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First League
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
