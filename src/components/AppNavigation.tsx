import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'

export function AppNavigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="flex space-x-4">
      <Link to="/pool">
        <Button variant={isActive('/pool') ? 'default' : 'secondary'}>
          Player Pool
        </Button>
      </Link>
      <Link to="/setup">
        <Button variant={isActive('/setup') ? 'default' : 'secondary'}>
          Game Setup
        </Button>
      </Link>
      <Link to="/league-setup">
        <Button variant={isActive('/league-setup') ? 'default' : 'secondary'}>
          League Setup
        </Button>
      </Link>
    </nav>
  )
}
