import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Tv } from 'lucide-react'

export function AppNavigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="flex space-x-2">
      <Link to="/">
        <Button variant={isActive('/') ? 'outline' : 'ghost'} size="sm">
          Home
        </Button>
      </Link>
      <Link to="/players">
        <Button variant={isActive('/players') ? 'outline' : 'ghost'} size="sm">
          Players
        </Button>
      </Link>
      <Link to="/games">
        <Button variant={isActive('/games') ? 'outline' : 'ghost'} size="sm">
          Games
        </Button>
      </Link>
      <Link to="/leagues">
        <Button variant={isActive('/leagues') ? 'outline' : 'ghost'} size="sm">
          Leagues
        </Button>
      </Link>
      <Link to="/televised">
        <Button
          variant={isActive('/televised') ? 'outline' : 'ghost'}
          size="sm"
        >
          Televised
        </Button>
      </Link>
    </nav>
  )
}
