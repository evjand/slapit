import { GameSetup } from '../components/GameSetup'
import { useNavigate } from 'react-router-dom'

export function HomeRoute() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Create New Game</h1>
        <p className="text-muted-foreground">
          Set up a new game and start playing!
        </p>
      </div>
      <GameSetup
        onGameCreated={(gameId) => {
          navigate(`/game/${gameId}`)
        }}
      />
    </div>
  )
}
