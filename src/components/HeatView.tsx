import { GameView } from './GameView'
import { HeatViewProps } from '../types'

export function HeatView({ heatId, onBack }: HeatViewProps) {
  return <GameView gameId={heatId} onBack={onBack} />
}
