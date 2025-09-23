import { GameSetup } from '../components/GameSetup'
import { useNavigate } from 'react-router-dom'

export function HomeRoute() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen items-center justify-center">
      <GameSetup
        onGameCreated={(gameId) => {
          navigate(`/game/${gameId}`)
        }}
      />
    </div>
  )
}
