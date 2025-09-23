import { LeagueSetup } from '../components/LeagueSetup'
import { useNavigate } from 'react-router-dom'

export function LeagueSetupRoute() {
  const navigate = useNavigate()

  return (
    <LeagueSetup
      onLeagueCreated={(leagueId) => {
        navigate(`/league/${leagueId}`)
      }}
    />
  )
}
