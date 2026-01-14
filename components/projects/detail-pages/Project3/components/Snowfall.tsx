'use client'

import { useMemo } from 'react'

// Deterministic pseudo-random based on seed to avoid hydration mismatch
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

export default function Snowfall() {
  const snowflakes = useMemo(
    () =>
      [...Array(15)].map((_, i) => ({
        left: seededRandom(i * 3 + 1) * 100,
        delay: seededRandom(i * 3 + 2) * 5,
        duration: 8 + seededRandom(i * 3 + 3) * 4,
        size: 6 + seededRandom(i * 3 + 4) * 6,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {snowflakes.map((flake, i) => (
        <div
          key={i}
          className="absolute text-white/20 animate-snowfall"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            fontSize: `${flake.size}px`,
          }}
        >
          ❄
        </div>
      ))}
      <style jsx>{`
        @keyframes snowfall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-snowfall { animation: snowfall linear infinite; }
      `}</style>
    </div>
  )
}
