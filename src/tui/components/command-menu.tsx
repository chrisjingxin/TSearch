import React, { useState, useMemo, useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { theme } from '../theme'

export interface Command {
  name: string
  description: string
  action: () => void
}

interface CommandMenuProps {
  commands: Command[]
  filter?: string
  onSelect: (command: Command) => void
  onClose: () => void
}

export function CommandMenu({ commands, filter = '', onSelect, onClose }: CommandMenuProps) {
  const filtered = useMemo(() => {
    if (!filter) return commands
    const f = filter.toLowerCase()
    return commands.filter((cmd) =>
      cmd.name.toLowerCase().includes(f) || cmd.description.toLowerCase().includes(f)
    )
  }, [commands, filter])

  const [selected, setSelected] = useState(0)

  // Reset selection when filter changes
  useEffect(() => {
    setSelected(0)
  }, [filter])

  useKeyboard((key: any) => {
    if (key.name === 'escape') {
      onClose()
      return
    }
    if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      setSelected((s) => (s - 1 + filtered.length) % filtered.length)
      return
    }
    if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      setSelected((s) => (s + 1) % filtered.length)
      return
    }
    if (key.name === 'return') {
      if (filtered[selected]) {
        onSelect(filtered[selected])
      }
      return
    }
  })

  if (filtered.length === 0) {
    return (
      <box flexDirection="column" backgroundColor={theme.backgroundElement} border={['left']} borderColor={theme.primary} paddingLeft={1} flexShrink={0}>
        <box>
          <text fg={theme.textMuted}>无匹配命令</text>
        </box>
      </box>
    )
  }

  return (
    <box
      flexDirection="column"
      backgroundColor={theme.backgroundElement}
      border={['left']}
      borderColor={theme.primary}
      paddingLeft={1}
      flexShrink={0}
    >
      <box paddingBottom={0}>
        <text fg={theme.textMuted}>命令</text>
      </box>
      {filtered.map((cmd, i) => (
        <box
          key={cmd.name}
          backgroundColor={i === selected ? theme.backgroundPanel : theme.backgroundElement}
          paddingLeft={0}
          paddingRight={1}
        >
          <text fg={i === selected ? theme.primary : theme.text}>
            {(i === selected ? ' ▸ ' : '   ') + cmd.name + '  ' + cmd.description}
          </text>
        </box>
      ))}
      <box paddingTop={0} paddingBottom={0}>
        <text fg={theme.textMuted}>↑↓ 选择  Enter 确认  Esc 取消</text>
      </box>
    </box>
  )
}
