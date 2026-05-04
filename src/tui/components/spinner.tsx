import React, { useState, useEffect } from 'react'
import { theme } from '../theme'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function Spinner({ text = 'thinking...' }: { text?: string }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length)
    }, 80)
    return () => clearInterval(timer)
  }, [])

  return (
    <text fg={theme.textMuted}>
      {FRAMES[frame]} {text}
    </text>
  )
}
