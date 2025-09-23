import { Authenticated, Unauthenticated, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { SignInForm } from './SignInForm'
import { SignOutButton } from './SignOutButton'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { PlayerPool } from './components/PlayerPool'
import { GameSetup } from './components/GameSetup'
import { GameView } from './components/GameView'
import { LeagueSetup } from './components/LeagueSetup'
import { LeagueView } from './components/LeagueView'
import { Id } from '../convex/_generated/dataModel'
import { SignUpForm } from './SignUpForm'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Slap It Manager</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">
        <Content />
      </main>
      <Toaster />
    </div>
  )
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser)
  const [currentView, setCurrentView] = useState<
    'pool' | 'setup' | 'game' | 'league-setup' | 'league'
  >('pool')
  const [selectedGameId, setSelectedGameId] = useState<Id<'games'> | null>(null)
  const [selectedLeagueId, setSelectedLeagueId] =
    useState<Id<'leagues'> | null>(null)

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Authenticated>
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setCurrentView('pool')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'pool'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Player Pool
            </button>
            <button
              onClick={() => setCurrentView('setup')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'setup'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Game Setup
            </button>
            <button
              onClick={() => setCurrentView('league-setup')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'league-setup'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              League Setup
            </button>
            {selectedGameId && (
              <button
                onClick={() => setCurrentView('game')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'game'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Current Game
              </button>
            )}
            {selectedLeagueId && (
              <button
                onClick={() => setCurrentView('league')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'league'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Current League
              </button>
            )}
          </nav>
        </div>

        {currentView === 'pool' && <PlayerPool />}
        {currentView === 'setup' && (
          <GameSetup
            onGameCreated={(gameId) => {
              setSelectedGameId(gameId)
              setCurrentView('game')
            }}
          />
        )}
        {currentView === 'league-setup' && (
          <LeagueSetup
            onLeagueCreated={(leagueId) => {
              setSelectedLeagueId(leagueId)
              setCurrentView('league')
            }}
          />
        )}
        {currentView === 'game' && selectedGameId && (
          <GameView gameId={selectedGameId} />
        )}
        {currentView === 'league' && selectedLeagueId && (
          <LeagueView leagueId={selectedLeagueId} />
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Slap It Manager
            </h1>
            <p className="text-xl text-gray-600">
              Manage your Slap It games and tournaments
            </p>
          </div>
          <SignInForm />
          <SignUpForm />
        </div>
      </Unauthenticated>
    </div>
  )
}
