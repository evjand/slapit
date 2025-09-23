import { BrowserRouter } from 'react-router-dom'
import { SignOutButton } from './SignOutButton'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { AppRouter } from './components/AppRouter'
import { AppNavigation } from './components/AppNavigation'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="bg-background flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center space-x-6">
              <h2 className="text-primary text-3xl font-extrabold italic">
                <span className="text-black dark:text-white">SLAP</span>
                <span className="text-primary">IT</span>
              </h2>
              <AppNavigation />
            </div>
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <SignOutButton />
            </div>
          </header>
          <main className="flex-1 p-4">
            <AppRouter />
          </main>
          <Toaster />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}
