import React from 'react'
import { theme } from '../theme'

const LOGO_ART = [
  '████████╗ ██████╗  ██████╗ ██████╗ ██╗████████╗',
  '╚══██╔══╝██╔══██╗██╔═══██╗██╔══██╗██║╚══██╔══╝',
  '   ██║   ██████╔╝██║   ██║██████╔╝██║   ██║   ',
  '   ██║   ██╔══██╗██║   ██║██╔══██╗██║   ██║   ',
  '   ██║   ██████╔╝╚██████╔╝██████╔╝██║   ██║   ',
  '   ╚═╝   ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝   ╚═╝   ',
]

const TAGLINE = 'Browser assistant in your terminal'

export function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <box flexDirection="column" alignItems="center">
        <text fg={theme.primary} attributes={1}>Tabbit</text>
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
