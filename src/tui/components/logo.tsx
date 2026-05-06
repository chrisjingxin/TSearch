import React from 'react'
import { theme } from '../theme'

const LOGO_ART = [
  '████████╗ ███████╗███████╗ █████╗ ██████╗  ██████╗██╗  ██╗',
  '╚══██╔══╝ ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝██║  ██║',
  '   ██║    ███████╗█████╗  ███████║██████╔╝██║     ███████║',
  '   ██║    ╚════██║██╔══╝  ██╔══██║██╔══██╗██║     ██╔══██║',
  '   ██║    ███████║███████╗██║  ██║██║  ██║╚██████╗██║  ██║',
  '   ╚═╝    ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝',
]

const TAGLINE = 'Search engine powered by AI'

export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <box flexDirection="column" alignItems="center">
        <text fg={theme.primary} attributes={1}>TSearch</text>
      </box>
    )
  }

  return (
    <box flexDirection="column" alignItems="center">
      {LOGO_ART.map((line, i) => (
        <text key={i} fg={theme.primary}>{line}</text>
      ))}
      <box paddingTop={1}>
        <text fg={theme.textMuted}>{TAGLINE}</text>
      </box>
    </box>
  )
}
