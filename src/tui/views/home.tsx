import React, { useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { theme } from '../theme'
import { useTui } from '../state'
import { Logo } from '../components/logo'
import { Prompt } from '../components/prompt'

export function HomeView() {
  const { init, loadModels, loadSessions, setView } = useTui()

  useEffect(() => {
    init()
    loadModels()
    loadSessions()
  }, [])

  useKeyboard((key: any) => {
    if (key.ctrl && key.name === 'l') {
      setView('session')
    }
  })

  return (
    <box flexDirection="column" width="100%" height="100%">
      {/* Top spacer */}
      <box flexGrow={1} />

      {/* Centered content - wider input area */}
      <box flexDirection="column" alignItems="center">
        <Logo />

        <box paddingTop={2} width="80%" maxWidth={90} minWidth={50}>
          <Prompt view="home" />
        </box>
      </box>

      {/* Bottom spacer */}
      <box flexGrow={1} />

      {/* Footer */}
      <box justifyContent="center" paddingBottom={1}>
        <text fg={theme.textMuted}>Ctrl+L 会话    Ctrl+M 模型    ? 帮助</text>
      </box>
    </box>
  )
}
