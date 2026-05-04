import React, { useCallback, useRef, useState } from 'react'
import { theme } from '../theme'
import { Spinner } from './spinner'
import { CommandMenu, type Command } from './command-menu'
import { ModelSelector } from './model-selector'
import { SessionSelector } from './session-selector'
import { useTui } from '../state'

// Override default keybindings: Enter = submit, Shift+Enter = newline
const keyBindings = [
  { name: 'return', action: 'submit' as const },
  { name: 'linefeed', action: 'submit' as const },
  { name: 'return', shift: true, action: 'newline' as const },
  { name: 'linefeed', shift: true, action: 'newline' as const },
]

type Popup = 'none' | 'commands' | 'model' | 'session'

export function Prompt({ focused = true, view = 'home' }: { focused?: boolean; view?: 'home' | 'session' }) {
  const {
    currentModel, isLoading, sendMessage, createSession,
    setView, switchModel, switchSession,
  } = useTui()
  const textareaRef = useRef<any>(null)
  const [text, setText] = useState('')
  const [popup, setPopup] = useState<Popup>('none')

  const clearInput = useCallback(() => {
    setText('')
    if (textareaRef.current) textareaRef.current.initialValue = ''
  }, [])

  // Home: only /sessions and /models
  // Session: /new, /sessions, /models, /export, /help
  const homeCommands: Command[] = [
    {
      name: '/sessions',
      description: '选择会话',
      action: () => {
        setPopup('session')
      },
    },
    {
      name: '/models',
      description: '切换模型',
      action: () => {
        setPopup('model')
      },
    },
  ]

  const sessionCommands: Command[] = [
    {
      name: '/new',
      description: '新建会话',
      action: () => {
        createSession()
        setPopup('none')
        clearInput()
      },
    },
    {
      name: '/sessions',
      description: '选择会话',
      action: () => {
        setPopup('session')
      },
    },
    {
      name: '/models',
      description: '切换模型',
      action: () => {
        setPopup('model')
      },
    },
    {
      name: '/export',
      description: '导出对话',
      action: () => {
        setPopup('none')
        clearInput()
        // TODO: implement export
      },
    },
    {
      name: '/help',
      description: '帮助信息',
      action: () => {
        setPopup('none')
        clearInput()
        // TODO: implement help
      },
    },
  ]

  const commands = view === 'session' ? sessionCommands : homeCommands

  const handleContentChange = useCallback(() => {
    const ta = textareaRef.current
    if (ta) {
      const val = ta.plainText
      if (typeof val === 'string') {
        setText(val)
        if (val.startsWith('/') && popup === 'none') {
          setPopup('commands')
        }
        if (!val.startsWith('/') && popup === 'commands') {
          setPopup('none')
        }
      }
    }
  }, [popup])

  const handleSubmit = useCallback(() => {
    if (popup !== 'none') return
    const ta = textareaRef.current
    const currentText = ta ? ta.plainText : text
    if (!currentText || !currentText.trim() || isLoading) return
    sendMessage(currentText.trim())
    clearInput()
  }, [text, isLoading, sendMessage, popup, clearInput])

  const handleCommandSelect = useCallback((cmd: Command) => {
    cmd.action()
  }, [])

  const handleCommandClose = useCallback(() => {
    setPopup('none')
    clearInput()
  }, [clearInput])

  const handleModelSelect = useCallback((model: string) => {
    switchModel(model)
    setPopup('none')
    clearInput()
  }, [switchModel, clearInput])

  const handleModelClose = useCallback(() => {
    setPopup('none')
    clearInput()
  }, [clearInput])

  const handleSessionSelect = useCallback((id: string, title: string) => {
    switchSession(id, title)
    setPopup('none')
    clearInput()
  }, [switchSession, clearInput])

  const handleSessionClose = useCallback(() => {
    setPopup('none')
    clearInput()
  }, [clearInput])

  return (
    <box flexDirection="column" flexShrink={0}>
      {/* Popup: command menu */}
      {popup === 'commands' && (
        <CommandMenu
          commands={commands}
          filter={text}
          onSelect={handleCommandSelect}
          onClose={handleCommandClose}
        />
      )}

      {/* Popup: model selector */}
      {popup === 'model' && (
        <ModelSelector
          onSelect={handleModelSelect}
          onClose={handleModelClose}
        />
      )}

      {/* Popup: session selector */}
      {popup === 'session' && (
        <SessionSelector
          onSelect={handleSessionSelect}
          onClose={handleSessionClose}
        />
      )}

      {/* Gray input area */}
      <box backgroundColor={theme.backgroundElement} paddingTop={1} paddingBottom={1} border={['left']} borderColor={focused ? theme.primary : theme.border} paddingLeft={1}>
        <box>
          {isLoading ? (
            <box paddingLeft={1}>
              <Spinner />
            </box>
          ) : (
            <textarea
              ref={textareaRef}
              initialValue=""
              keyBindings={keyBindings}
              onSubmit={handleSubmit}
              onContentChange={handleContentChange}
              minHeight={3}
              maxHeight={8}
              backgroundColor={theme.backgroundElement}
              placeholder="输入问题，/ 查看命令..."
              placeholderColor={theme.textMuted}
              focused={focused}
            />
          )}
        </box>
        {/* Status line */}
        <box paddingLeft={1} paddingTop={0} flexDirection="row">
          <text fg={theme.text}>{String(currentModel) + '    Enter 发送  Shift+Enter 换行'}</text>
        </box>
      </box>
    </box>
  )
}
