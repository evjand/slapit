import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import { PlayerCard } from './PlayerCard'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { SimpleUserAvatar } from './UserAvatar'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function PlayerPool() {
  const players = useQuery(api.players.list) || []
  const eloLeaderboard = useQuery(api.elo.getEloLeaderboard) || []
  const createPlayer = useMutation(api.players.create)

  const [newPlayerName, setNewPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [sortField, setSortField] = useState<
    'rank' | 'wins' | 'points' | 'eliminations' | 'gamesPlayed' | 'winRate' | 'avgPoints' | 'avgEliminations' | 'elo'
  >('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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

  const handleSort = (field: 'rank' | 'wins' | 'points' | 'eliminations' | 'gamesPlayed' | 'winRate' | 'avgPoints' | 'avgEliminations' | 'elo') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Create ELO map for quick lookup
  const eloMap = new Map(eloLeaderboard.map(elo => [elo.playerId, elo.currentRating]))

  // Calculate actual rankings based on wins first, then points
  const playersWithRank = [...players].map((player, index) => {
    // Calculate rank based on wins first, then points (descending)
    const rank =
      players.filter(
        (p) =>
          p.totalWins > player.totalWins ||
          (p.totalWins === player.totalWins &&
            p.totalPoints > player.totalPoints),
      ).length + 1

    // Calculate performance metrics
    const gamesPlayed = player.totalGamesPlayed || 0
    const winRate = gamesPlayed > 0 ? (player.totalWins / gamesPlayed) * 100 : 0
    const avgPoints = gamesPlayed > 0 ? player.totalPoints / gamesPlayed : 0
    const avgEliminations = gamesPlayed > 0 ? player.totalEliminations / gamesPlayed : 0
    const eloRating = eloMap.get(player._id!) || null

    return { 
      ...player, 
      actualRank: rank,
      winRate,
      avgPoints,
      avgEliminations,
      eloRating,
    }
  })

  // Sort players based on selected field and direction (for table display only)
  const sortedPlayers = playersWithRank.sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'wins':
        comparison = a.totalWins - b.totalWins
        break
      case 'points':
        comparison = a.totalPoints - b.totalPoints
        break
      case 'eliminations':
        comparison = a.totalEliminations - b.totalEliminations
        break
      case 'gamesPlayed':
        comparison = (a.totalGamesPlayed || 0) - (b.totalGamesPlayed || 0)
        break
      case 'winRate':
        comparison = a.winRate - b.winRate
        break
      case 'avgPoints':
        comparison = a.avgPoints - b.avgPoints
        break
      case 'avgEliminations':
        comparison = a.avgEliminations - b.avgEliminations
        break
      case 'elo':
        comparison = (a.eloRating || 0) - (b.eloRating || 0)
        break
      case 'rank':
      default:
        // Default ranking: wins first, then points
        if (a.totalWins !== b.totalWins) {
          comparison = b.totalWins - a.totalWins
        } else {
          comparison = b.totalPoints - a.totalPoints
        }
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Keep original order for player cards (not affected by table sorting)
  const originalOrderPlayers = playersWithRank

  return (
    <div className="space-y-6">
      {/* Player Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Player Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPlayers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center gap-1">
                      Rank
                      {sortField === 'rank' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('gamesPlayed')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Games Played
                      {sortField === 'gamesPlayed' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('wins')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Games Won
                      {sortField === 'wins' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('winRate')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Win Rate
                      {sortField === 'winRate' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('points')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total Points
                      {sortField === 'points' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('avgPoints')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg Pts/Game
                      {sortField === 'avgPoints' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('eliminations')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Eliminations
                      {sortField === 'eliminations' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('avgEliminations')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg Elim/Game
                      {sortField === 'avgEliminations' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => handleSort('elo')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      ELO Rating
                      {sortField === 'elo' &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player, index) => (
                  <TableRow key={player._id}>
                    <TableCell className="font-medium">
                      #{player.actualRank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <SimpleUserAvatar
                          userId={player._id!}
                          size="sm"
                          imageStorageId={player.imageStorageId}
                          initials={player.initials}
                          name={player.name}
                        />
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {player.totalGamesPlayed || 0}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {player.totalWins}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-500">
                      {(player.totalGamesPlayed || 0) > 0 
                        ? `${player.winRate.toFixed(1)}%` 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {player.totalPoints}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-500">
                      {(player.totalGamesPlayed || 0) > 0 
                        ? player.avgPoints.toFixed(1) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      {player.totalEliminations}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-500">
                      {(player.totalGamesPlayed || 0) > 0 
                        ? player.avgEliminations.toFixed(1) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-purple-600">
                      {player.eloRating || 'Unrated'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-foreground/50 py-8 text-center">
              No players added yet. Add your first player below!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Player */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Add New Player</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePlayer}>
            <div className="flex gap-3">
              <Input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                disabled={isCreating}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isCreating || !newPlayerName.trim()}
              >
                {isCreating ? 'Adding...' : 'Add Player'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Player Management Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Manage Players</CardTitle>
        </CardHeader>
        <CardContent>
          {originalOrderPlayers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {originalOrderPlayers.map((player) => (
                <PlayerCard key={player._id} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-foreground/50 py-8 text-center">
              No players to manage yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
