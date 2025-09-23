import { LeagueView } from '../components/LeagueView'
import { useParams } from 'react-router-dom'
import { Id } from '../../convex/_generated/dataModel'
import PageWrapper from '@/components/PageWrapper'

export function LeagueViewRoute() {
  const { leagueId } = useParams<{ leagueId: string }>()

  if (!leagueId) {
    return (
      <PageWrapper>
        <div>League ID not found</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <LeagueView leagueId={leagueId as Id<'leagues'>} />
    </PageWrapper>
  )
}
