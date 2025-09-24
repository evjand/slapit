import React from 'react'
import { UserAvatar, SimpleUserAvatar } from './UserAvatar'

// Demo component to showcase the avatar generator
export function AvatarDemo() {
  // Sample user IDs for demonstration
  const sampleUserIds = [
    'user_123456789',
    'player_abcdefgh',
    'user_xyz789abc',
    'player_456def123',
    'user_mnopqrst',
    'player_987654321',
  ]

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Avatar Generator Demo</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Each user ID generates a unique, deterministic pattern that will
          always be the same for that ID.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">
          Simple Patterns (Recommended)
        </h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {sampleUserIds.map((userId, index) => (
            <div key={userId} className="text-center">
              <SimpleUserAvatar
                userId={userId as any}
                size="lg"
                name={`User ${index + 1}`}
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                User {index + 1}
              </p>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-500">
                {userId}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">
          Grid Patterns (More Complex)
        </h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {sampleUserIds.map((userId, index) => (
            <div key={userId} className="text-center">
              <UserAvatar userId={userId as any} size="lg" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                User {index + 1}
              </p>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-500">
                {userId}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Size Variations</h3>
        <div className="flex items-center space-x-4">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div key={size} className="text-center">
              <SimpleUserAvatar
                userId={sampleUserIds[0] as any}
                size={size}
                name="Demo User"
              />
              <p className="mt-2 text-sm text-gray-600 capitalize dark:text-gray-400">
                {size}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h4 className="mb-2 font-semibold">How it works:</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Each user ID is hashed to generate a unique seed</li>
          <li>• The seed determines colors, patterns, and shapes</li>
          <li>• Same user ID always produces the same avatar</li>
          <li>• Different user IDs produce visually distinct avatars</li>
          <li>• Works with any string ID (user IDs, player IDs, etc.)</li>
        </ul>
      </div>
    </div>
  )
}
