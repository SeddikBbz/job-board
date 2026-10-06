import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

import type { Job } from '@/payload-types'

type RichText = Job['description']

// Dashboard forms use a plain textarea: blank lines separate paragraphs.
export const textToRichText = (text: string): RichText => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        children: [{ type: 'text', version: 1, text: paragraph, format: 0, style: '', mode: 'normal', detail: 0 }],
      })),
  },
})

// Formatting made in the admin editor (bold, lists…) becomes plain paragraphs here.
export const richTextToText = (value: RichText | null | undefined) => {
  if (!value?.root?.children) return ''
  return value.root.children
    .map((node) => convertLexicalToPlaintext({ data: { root: { ...value.root, children: [node] } } as never }).trim())
    .filter(Boolean)
    .join('\n\n')
}
