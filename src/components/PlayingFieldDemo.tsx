import React from 'react'
import {
  PlayingField,
  GamePlayingField,
  HeatPlayingField,
  PlayerDisplayField,
} from './PlayingField'
import { Id } from '../../convex/_generated/dataModel'

// Demo component to showcase the PlayingField component
export function PlayingFieldDemo() {
  // Sample players for demonstration
  const samplePlayers = [
    {
      _id: 'player_1' as Id<'players'>,
      name: 'Alice',
      currentPoints: 15,
      totalPoints: 45,
    },
    {
      _id: 'player_2' as Id<'players'>,
      name: 'Bob',
      currentPoints: 12,
      totalPoints: 38,
    },
    {
      _id: 'player_3' as Id<'players'>,
      name: 'Charlie',
      currentPoints: 8,
      totalPoints: 22,
    },
    {
      _id: 'player_4' as Id<'players'>,
      name: 'Diana',
      currentPoints: 20,
      totalPoints: 52,
    },
  ]

  const handlePlayerClick = (playerId: Id<'players'>) => {
    console.log('Player clicked:', playerId)
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">PlayingField Component Demo</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Reusable playing field component with different layouts and
          configurations.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">
          Game Playing Field (Default)
        </h3>
        <GamePlayingField
          players={samplePlayers}
          serverId={samplePlayers[0]._id}
          onPlayerEliminate={handlePlayerClick}
        />
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Heat Playing Field</h3>
        <HeatPlayingField
          players={samplePlayers}
          serverId={samplePlayers[1]._id}
          onPlayerEliminate={handlePlayerClick}
        />
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">
          Custom Playing Field - Grid Layout
        </h3>
        <PlayingField
          players={samplePlayers}
          serverId={samplePlayers[2]._id}
          onPlayerClick={handlePlayerClick}
          layout="grid"
          avatarSize="lg"
          className="border-blue-200 bg-blue-50"
        />
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">
          Player Display Field (Read-only)
        </h3>
        <PlayerDisplayField
          players={samplePlayers}
          layout="grid"
          showPoints={true}
        />
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Vertical Layout</h3>
        <PlayingField
          players={samplePlayers.slice(0, 3)}
          serverId={samplePlayers[0]._id}
          onPlayerClick={handlePlayerClick}
          layout="vertical"
          avatarSize="sm"
          className="border-purple-200 bg-purple-50"
        />
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 className="mb-2 font-semibold">Features:</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Multiple layout options: horizontal, vertical, grid</li>
          <li>• Server indicator with customizable styling</li>
          <li>• Click handlers for player interactions</li>
          <li>• Disabled state support</li>
          <li>• Customizable avatar sizes and styling</li>
          <li>• Points display with custom labels</li>
          <li>• Specialized components for common use cases</li>
        </ul>
      </div>
    </div>
  )
}
