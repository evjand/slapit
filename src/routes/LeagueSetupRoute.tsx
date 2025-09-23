import PageWrapper from '@/components/PageWrapper'
import { LeagueSetup } from '../components/LeagueSetup'
import { useNavigate } from 'react-router-dom'

export function LeagueSetupRoute() {
  const navigate = useNavigate()

  return (
    <PageWrapper>
      <LeagueSetup
        onLeagueCreated={(leagueId) => {
          navigate(`/league/${leagueId}`)
        }}
      />
    </PageWrapper>
  )
}
