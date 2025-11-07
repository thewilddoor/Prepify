'use client'

import React from 'react'

interface BreathingDotProps {
  className?: string
  isActive?: boolean
}

export function BreathingDot({ className = '', isActive = true }: BreathingDotProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer breathing ring */}
      {isActive && (
        <div
          className="absolute size-4 rounded-full bg-[#DAC2EF] opacity-50"
          style={{
            animation: 'breathe 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Inner solid dot */}
      <div
        className={`size-2 rounded-full ${isActive ? 'bg-[#DAC2EF]' : 'bg-[#DAC2EF]/50'}`}
      />

      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.8);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  )
}
