import { Routes, Route } from 'react-router-dom'
import { Authenticated, Unauthenticated, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SignInForm } from '../SignInForm'
import {
  HomeRoute,
  PlayerPoolRoute,
  PlayerDetailRoute,
  GameSetupRoute,
  LeagueSetupRoute,
  GameViewRoute,
  LeagueViewRoute,
  GamesOverviewRoute,
  LeaguesOverviewRoute,
  TelevisedRoute,
} from '../routes'
import { SignUpForm } from '@/SignUpForm'

function RouterContent() {
  const loggedInUser = useQuery(api.auth.loggedInUser)

  if (loggedInUser === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  return (
    <>
      <Authenticated>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/players" element={<PlayerPoolRoute />} />
          <Route path="/player/:playerId" element={<PlayerDetailRoute />} />
          <Route path="/games" element={<GamesOverviewRoute />} />
          <Route path="/leagues" element={<LeaguesOverviewRoute />} />
          <Route path="/leagues/create" element={<LeagueSetupRoute />} />
          <Route path="/game/:gameId" element={<GameViewRoute />} />
          <Route path="/league/:leagueId" element={<LeagueViewRoute />} />
          <Route
            path="/league/:leagueId/game/:gameId"
            element={<GameViewRoute />}
          />
          <Route path="/televised" element={<TelevisedRoute />} />
        </Routes>
      </Authenticated>

      <Unauthenticated>
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-primary text-3xl font-extrabold italic">
              <span className="text-black dark:text-white">SLAP</span>
              <span className="text-primary">IT</span>
            </h2>
          </div>
          <SignInForm />
          {process.env.NODE_ENV}
          {process.env.VERCEL_ENV}
          {(process.env.NODE_ENV === 'development' ||
            process.env.VERCEL_ENV === 'preview') && <SignUpForm />}
        </div>
      </Unauthenticated>
    </>
  )
}

export function AppRouter() {
  return <RouterContent />
}
