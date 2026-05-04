import React, { useState, useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { theme } from '../theme'
import { useTui } from '../state'

interface SessionSelectorProps {
  onSelect: (id: string, title: string) => void
  onClose: () => void
}

export function SessionSelector({ onSelect, onClose }: SessionSelectorProps) {
  const { sessions, sessionId, loadSessions } = useTui()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    loadSessions()
  }, [])

  // Find current session index
  useEffect(() => {
    if (!sessionId) return
    const idx = sessions.findIndex((s) => s.chat_session_id === sessionId)
    if (idx >= 0) setSelected(idx)
  }, [sessions, sessionId])

  useKeyboard((key: any) => {
    if (key.name === 'escape') {
      onClose()
      return
    }
    if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      setSelected((s) => (s - 1 + sessions.length) % sessions.length)
      return
    }
    if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      setSelected((s) => (s + 1) % sessions.length)
      return
    }
    if (key.name === 'return') {
      const s = sessions[selected]
      if (s) {
        onSelect(s.chat_session_id, s.chat_session_title || '会话')
      }
      return
    }
  })

  if (sessions.length === 0) {
    return (
      <box flexDirection="column" backgroundColor={theme.backgroundElement} border={['left']} borderColor={theme.primary} paddingLeft={1} flexShrink={0}>
        <box paddingBottom={0}>
          <text fg={theme.textMuted}>会话</text>
        </box>
        <box>
          <text fg={theme.textMuted}>暂无历史会话</text>
        </box>
        <box paddingTop={0} paddingBottom={0}>
          <text fg={theme.textMuted}>Esc 取消</text>
        </box>
      </box>
    )
  }

  return (
    <box flexDirection="column" backgroundColor={theme.backgroundElement} border={['left']} borderColor={theme.primary} paddingLeft={1} flexShrink={0}>
      <box paddingBottom={0}>
        <text fg={theme.textMuted}>选择会话</text>
      </box>
      {sessions.map((s, i) => {
        const isSelected = i === selected
        const isCurrent = s.chat_session_id === sessionId
        const title = s.chat_session_title || '未命名会话'
        return (
          <box
            key={s.chat_session_id || i}
            backgroundColor={isSelected ? theme.backgroundPanel : theme.backgroundElement}
          >
            <text fg={isSelected ? theme.primary : theme.text}>
              {(isSelected ? ' ▸ ' : '   ') + title + (isCurrent ? ' (当前)' : '')}
            </text>
          </box>
        )
      })}
      <box paddingTop={0} paddingBottom={0}>
        <text fg={theme.textMuted}>↑↓ 选择  Enter 确认  Esc 取消</text>
      </box>
    </box>
  )
}
