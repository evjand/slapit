import { GameView } from '../components/GameView'
import { useParams } from 'react-router-dom'
import { Id } from '../../convex/_generated/dataModel'
import PageWrapper from '@/components/PageWrapper'

export function GameViewRoute() {
  const { gameId } = useParams<{ gameId: string }>()

  if (!gameId) {
    return (
      <PageWrapper>
        <div>Game ID not found</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <GameView gameId={gameId as Id<'games'>} />
    </PageWrapper>
  )
}
