import React from 'react'
import { Box } from '@opentui/react'
import { theme } from './theme'
import { TuiProvider, useTui } from './state'
import { HomeView } from './views/home'
import { SessionView } from './views/session'

function Router() {
  const { view } = useTui()

  return (
    <box width="100%" height="100%" backgroundColor={theme.background}>
      {view === 'home' ? <HomeView /> : <SessionView />}
    </box>
  )
}

export function App() {
  return (
    <TuiProvider>
      <Router />
    </TuiProvider>
  )
}
