import { GameSetup } from '../components/GameSetup'
import { useNavigate } from 'react-router-dom'

export function GameSetupRoute() {
  const navigate = useNavigate()

  return (
    <GameSetup
      onGameCreated={(gameId) => {
        navigate(`/game/${gameId}`)
      }}
    />
  )
}
