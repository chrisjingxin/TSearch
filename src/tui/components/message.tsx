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

export function AssistantMessage({ content }: { content: string }) {
  const text = typeof content === 'string' ? content : String(content)
  if (!text || text === '(无回复内容)') {
    return (
      <box paddingLeft={3} paddingTop={1} paddingBottom={1}>
        <text fg={theme.textMuted}>(无回复内容)</text>
      </box>
    )
  }

  return (
    <box paddingLeft={3} paddingTop={1} paddingBottom={1}>
      <markdown content={text} syntaxStyle={getMarkdownSyntaxStyle()} fg={theme.text} />
    </box>
  )
}

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />
  }
  return <AssistantMessage content={message.content} />
}
