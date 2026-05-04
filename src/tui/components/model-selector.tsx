import React, { useState, useEffect } from 'react'
import { useKeyboard } from '@opentui/react'
import { theme } from '../theme'
import { useTui } from '../state'

interface ModelSelectorProps {
  onSelect: (model: string) => void
  onClose: () => void
}

// "最佳" is always the first option
const BEST_MODEL = { id: '__best__', display_name: '最佳', description: '自动选择最佳模型' }

export function ModelSelector({ onSelect, onClose }: ModelSelectorProps) {
  const { models, currentModel, loadModels } = useTui()
  const [selected, setSelected] = useState(0)

  // Build full list: 最佳 + API models (deduplicated)
  const allModels = [BEST_MODEL, ...models.filter((m: any) => m.display_name !== '最佳')]

  useEffect(() => {
    loadModels()
  }, [])

  // Find current model index
  useEffect(() => {
    const idx = allModels.findIndex((m: any) => m.display_name === currentModel)
    if (idx >= 0) setSelected(idx)
  }, [models, currentModel])

  useKeyboard((key: any) => {
    if (key.name === 'escape') {
      onClose()
      return
    }
    if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      setSelected((s) => (s - 1 + allModels.length) % allModels.length)
      return
    }
    if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      setSelected((s) => (s + 1) % allModels.length)
      return
    }
    if (key.name === 'return') {
      if (allModels[selected]) {
        onSelect(allModels[selected].display_name)
      }
      return
    }
  })

  return (
    <box flexDirection="column" backgroundColor={theme.backgroundElement} border={['left']} borderColor={theme.primary} paddingLeft={1} flexShrink={0}>
      <box paddingBottom={0}>
        <text fg={theme.textMuted}>选择模型</text>
      </box>
      {allModels.map((m: any, i: number) => {
        const isSelected = i === selected
        const isCurrent = m.display_name === currentModel
        return (
          <box
            key={m.id || i}
            backgroundColor={isSelected ? theme.backgroundPanel : theme.backgroundElement}
          >
            <text fg={isSelected ? theme.primary : theme.text}>
              {(isSelected ? ' ▸ ' : '   ') + m.display_name + (isCurrent ? ' (当前)' : '')}
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
