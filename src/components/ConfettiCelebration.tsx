import { type CSSProperties, useEffect, useMemo, useState } from 'react'

const CONFETTI_COLORS = [
  '#f97316',
  '#f59e0b',
  '#34d399',
  '#38bdf8',
  '#a855f7',
  '#ef4444',
  '#22d3ee',
  '#facc15',
]

const PIECE_COUNT = 180
const MAX_DURATION = 6
const MIN_DURATION = 3.5

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  drift: number
  rotateStart: number
  rotateEnd: number
  size: number
  heightFactor: number
  color: string
  borderRadius: string
}

export function ConfettiCelebration() {
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setIsActive(false), MAX_DURATION * 1000)
    return () => clearTimeout(timeout)
  }, [])

  const pieces = useMemo<ConfettiPiece[]>(() => {
    const randomBetween = (min: number, max: number) =>
      Math.random() * (max - min) + min

    return Array.from({ length: PIECE_COUNT }, (_, index) => {
      const size = randomBetween(4, 10)
      return {
        id: index,
        left: randomBetween(0, 100),
        delay: randomBetween(0, 1.8),
        duration: randomBetween(MIN_DURATION, MAX_DURATION),
        drift: randomBetween(-120, 120),
        rotateStart: randomBetween(0, 360),
        rotateEnd: randomBetween(720, 1440),
        size,
        heightFactor: randomBetween(0.7, 1.6),
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        borderRadius: Math.random() > 0.7 ? '999px' : '4px',
      }
    })
  }, [])

  if (!isActive) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((piece) => {
        const style: CSSProperties & Record<string, string> = {
          left: `${piece.left}%`,
          width: `${piece.size}px`,
          height: `${piece.size * piece.heightFactor}px`,
          backgroundColor: piece.color,
          borderRadius: piece.borderRadius,
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`,
          '--confetti-drift': `${piece.drift}px`,
          '--confetti-rotate-start': `${piece.rotateStart}deg`,
          '--confetti-rotate-end': `${piece.rotateEnd}deg`,
        }

        return <span key={piece.id} className="confetti-piece" style={style} />
      })}
    </div>
  )
}
