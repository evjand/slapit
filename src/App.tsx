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
import { Button } from './components/ui/button'
import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="bg-background flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4 shadow-sm backdrop-blur-sm">
          <h2 className="text-primary text-3xl font-extrabold italic">
            <span className="text-black dark:text-white">SLAP</span>
            <span className="text-primary">IT</span>
          </h2>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-4">
          <Content />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <Authenticated>
        <div className="mb-6">
          <nav className="flex space-x-4">
            <Button
              variant={currentView === 'pool' ? 'default' : 'secondary'}
              onClick={() => setCurrentView('pool')}
            >
              Player Pool
            </Button>
            <Button
              variant={currentView === 'setup' ? 'default' : 'secondary'}
              onClick={() => setCurrentView('setup')}
            >
              Game Setup
            </Button>
            <Button
              variant={currentView === 'league-setup' ? 'default' : 'secondary'}
              onClick={() => setCurrentView('league-setup')}
            >
              League Setup
            </Button>
            {selectedGameId && (
              <Button onClick={() => setCurrentView('game')}>
                Current Game
              </Button>
            )}
            {selectedLeagueId && (
              <Button onClick={() => setCurrentView('league')}>
                Current League
              </Button>
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
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-primary text-3xl font-extrabold italic">
              <span className="text-black dark:text-white">SLAP</span>
              <span className="text-primary">IT</span>
            </h2>
          </div>
          <SignInForm />
          {/* <SignUpForm /> */}
        </div>
      </Unauthenticated>
    </div>
  )
}
