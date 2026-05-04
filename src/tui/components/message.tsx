import React from 'react'
import { theme } from '../theme'
import { getMarkdownSyntaxStyle } from '../lib/markdown-style'
import type { Message } from '../state'

export function UserMessage({ content }: { content: string }) {
  const text = typeof content === 'string' ? content : String(content)
  return (
    <box
      border={['left']}
      borderColor={theme.primary}
      paddingLeft={2}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={0}
    >
      <text fg={theme.text}>{text}</text>
    </box>
  )
}

export function AssistantMessage({ content, thinking }: { content: string; thinking?: string }) {
  const text = typeof content === 'string' ? content : String(content)
  const thinkingText = typeof thinking === 'string' ? thinking : ''

  return (
    <box flexDirection="column" paddingLeft={3} paddingTop={1} paddingBottom={1}>
      {/* Thinking/reasoning section */}
      {thinkingText ? (
        <box flexDirection="column" border={['left']} borderColor={theme.border} paddingLeft={1}>
          <text fg={theme.textMuted}>{'💭 思考过程'}</text>
          <text fg={theme.textMuted} wrap>{thinkingText}</text>
        </box>
      ) : null}
      {/* Main content */}
      {(!text || text === '(无回复内容)') ? (
        <text fg={theme.textMuted}>(无回复内容)</text>
      ) : (
        <markdown content={text} syntaxStyle={getMarkdownSyntaxStyle()} fg={theme.text} />
      )}
    </box>
  )
}

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />
  }
  return <AssistantMessage content={message.content} thinking={message.thinking} />
}
