import React from 'react'
import { Id } from '../../convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface UserAvatarProps {
  userId: Id<'users'> | Id<'players'>
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  imageStorageId?: Id<'_storage'>
}

// Generate a deterministic color palette based on user ID
function generateColorPalette(userId: string): string[] {
  // Simple hash function to convert string to number
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get positive numbers
  const seed = Math.abs(hash)

  // Generate 4 colors using the seed
  const colors = []
  for (let i = 0; i < 4; i++) {
    const hue = (seed + i * 90) % 360
    const saturation = 60 + (seed % 30) // 60-90%
    const lightness = 45 + (seed % 20) // 45-65%
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }

  return colors
}

// Generate a unique pattern based on user ID
function generatePattern(userId: string): {
  colors: string[]
  pattern: number[][]
  shape: 'circle' | 'square' | 'triangle'
} {
  const colors = generateColorPalette(userId)

  // Create a simple hash for pattern generation
  let patternHash = 0
  for (let i = 0; i < userId.length; i++) {
    patternHash += userId.charCodeAt(i) * (i + 1)
  }

  // Generate a 4x4 pattern
  const pattern: number[][] = []
  for (let row = 0; row < 4; row++) {
    pattern[row] = []
    for (let col = 0; col < 4; col++) {
      // Use different parts of the hash for each position
      const positionHash = (patternHash + row * 4 + col) % 4
      pattern[row][col] = positionHash
    }
  }

  // Determine shape based on hash
  const shapeHash = patternHash % 3
  const shapes: ('circle' | 'square' | 'triangle')[] = [
    'circle',
    'square',
    'triangle',
  ]
  const shape = shapes[shapeHash]

  return { colors, pattern, shape }
}

export function UserAvatar({
  userId,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const { colors, pattern, shape } = generatePattern(userId)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  }

  const cellSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-6 h-6',
    '2xl': 'w-8 h-8',
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className} overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700`}
    >
      <div className="grid h-full w-full grid-cols-4 grid-rows-4">
        {pattern.map((row, rowIndex) =>
          row.map((colorIndex, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`${cellSize[size]} ${shape === 'circle' ? 'rounded-full' : shape === 'triangle' ? 'clip-path-triangle' : 'rounded-sm'}`}
              style={{
                backgroundColor: colors[colorIndex],
                clipPath:
                  shape === 'triangle'
                    ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                    : undefined,
              }}
            />
          )),
        )}
      </div>
    </div>
  )
}

// Alternative simpler pattern generator for better performance
export function SimpleUserAvatar({
  userId,
  size = 'md',
  className = '',
  imageStorageId,
}: UserAvatarProps) {
  const imageUrl = useQuery(
    api.players.getImageUrl,
    imageStorageId ? { storageId: imageStorageId } : 'skip',
  )

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  }

  // If we have an image, show it
  if (imageUrl) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} bg-accent border-border overflow-hidden rounded-full border`}
      >
        <img
          src={imageUrl}
          alt="Player avatar"
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  // Fallback to generated pattern
  const colors = generateColorPalette(userId)

  // Create a simple hash for pattern
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash += userId.charCodeAt(i)
  }

  // Generate a simple geometric pattern
  const patternType = hash % 4

  return (
    <div
      className={`${sizeClasses[size]} ${className} bg-accent border-border overflow-hidden rounded-full border`}
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            patternType === 0
              ? `linear-gradient(45deg, ${colors[0]} 25%, ${colors[1]} 25%, ${colors[1]} 50%, ${colors[2]} 50%, ${colors[2]} 75%, ${colors[3]} 75%)`
              : patternType === 1
                ? `radial-gradient(circle at 30% 30%, ${colors[0]} 0%, ${colors[1]} 30%, ${colors[2]} 60%, ${colors[3]} 100%)`
                : patternType === 2
                  ? `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[3]}, ${colors[0]})`
                  : `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 50%, ${colors[3]} 75%, ${colors[0]} 100%)`,
        }}
      />
    </div>
  )
}
