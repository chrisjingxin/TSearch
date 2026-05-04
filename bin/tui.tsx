import { createCliRenderer } from '@opentui/core'
import { createRoot } from '@opentui/react'
import { App } from '../src/tui/app'
import { theme } from '../src/tui/theme'

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useMouse: true,
    screenMode: 'alternate-screen',
    backgroundColor: theme.background,
  })

  createRoot(renderer).render(<App />)
}

main().catch((err) => {
  console.error('Failed to start TUI:', err)
  process.exit(1)
})
