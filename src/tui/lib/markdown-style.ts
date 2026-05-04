import { SyntaxStyle } from '@opentui/core'
import { theme } from '../theme'

let _mdStyle: SyntaxStyle | null = null

// Markdown syntax style matching tree-sitter capture names
// See: node_modules/@opentui/core/assets/markdown/highlights.scm
export function getMarkdownSyntaxStyle(): SyntaxStyle {
  if (_mdStyle) return _mdStyle

  const style = SyntaxStyle.create()

  // Headings - bold with theme primary color
  style.registerStyle('markup.heading', {
    fg: theme.primary,
    bold: true,
  })
  style.registerStyle('markup.heading.1', { fg: theme.primary, bold: true })
  style.registerStyle('markup.heading.2', { fg: theme.primary, bold: true })
  style.registerStyle('markup.heading.3', { fg: theme.primary, bold: true })
  style.registerStyle('markup.heading.4', { fg: theme.primary, bold: true })
  style.registerStyle('markup.heading.5', { fg: theme.primary, bold: true })
  style.registerStyle('markup.heading.6', { fg: theme.primary, bold: true })

  // Strong / bold
  style.registerStyle('markup.strong', {
    bold: true,
  })

  // Italic / emphasis
  style.registerStyle('markup.italic', {
    italic: true,
  })

  // Code spans (inline code) - cyan
  style.registerStyle('markup.raw', {
    fg: '#22d3ee',
  })

  // Code blocks - same cyan for content
  style.registerStyle('markup.raw.block', {
    fg: '#22d3ee',
  })

  // Strikethrough
  style.registerStyle('markup.strikethrough', {
    dim: true,
  })

  // Links
  style.registerStyle('markup.link', {
    fg: '#60a5fa',
    underline: true,
  })
  style.registerStyle('markup.link.url', {
    fg: '#60a5fa',
    underline: true,
  })
  style.registerStyle('markup.link.label', {
    fg: '#60a5fa',
  })

  // Block quote
  style.registerStyle('markup.quote', {
    fg: theme.textMuted,
    italic: true,
  })

  // List markers
  style.registerStyle('markup.list', {
    fg: theme.primary,
  })
  style.registerStyle('markup.list.checked', {
    fg: theme.success,
  })
  style.registerStyle('markup.list.unchecked', {
    fg: theme.textMuted,
  })

  // Thematic break (hr) - visible separator
  style.registerStyle('punctuation.special', {
    fg: theme.border,
  })

  // Labels (e.g. code block language)
  style.registerStyle('label', {
    fg: theme.textMuted,
    italic: true,
  })

  // Default text
  style.registerStyle('default', {
    fg: theme.text,
  })

  _mdStyle = style
  return style
}
