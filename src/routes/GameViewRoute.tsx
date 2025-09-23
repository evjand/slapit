import { GameView } from '../components/GameView'
import { useParams } from 'react-router-dom'
import { Id } from '../../convex/_generated/dataModel'

export function GameViewRoute() {
  const { gameId } = useParams<{ gameId: string }>()

  if (!gameId) {
    return <div>Game ID not found</div>
  }

  return <GameView gameId={gameId as Id<'games'>} />
}
