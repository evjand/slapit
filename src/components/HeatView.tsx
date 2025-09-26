import { Id } from '../../convex/_generated/dataModel'
import { GameView } from './GameView'

interface HeatViewProps {
  heatId: Id<'heats'>
  onBack: () => void
}

export function HeatView({ heatId, onBack }: HeatViewProps) {
  return <GameView heatId={heatId} onBack={onBack} />
}
