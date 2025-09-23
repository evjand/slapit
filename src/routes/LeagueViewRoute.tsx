import { LeagueView } from '../components/LeagueView'
import { useParams } from 'react-router-dom'
import { Id } from '../../convex/_generated/dataModel'

export function LeagueViewRoute() {
  const { leagueId } = useParams<{ leagueId: string }>()

  if (!leagueId) {
    return <div>League ID not found</div>
  }

  return <LeagueView leagueId={leagueId as Id<'leagues'>} />
}
