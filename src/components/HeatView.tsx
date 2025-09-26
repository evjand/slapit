import { Id } from '../../convex/_generated/dataModel'
import { GameView } from './GameView'

interface HeatViewProps {
  heatId: Id<'games'> // Now takes a game ID instead of heat ID
  onBack: () => void
}

export function HeatView({ heatId, onBack }: HeatViewProps) {
  return <GameView gameId={heatId} onBack={onBack} />
}
