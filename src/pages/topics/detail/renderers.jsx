// This file contains non-component helpers for the topic detail page.
// Keeping it separate helps React Fast Refresh (react-refresh/only-export-components).

import React from 'react'

const DefaultContent = ({ type, value }) => (
  <div className="mt-3 p-4 border border-dashed rounded-md text-center">
    <div className="text-sm text-muted-foreground">Tipe konten tidak dikenali: {type}</div>
    {value && (
      <div className="mt-2 text-xs text-slate-600">
        <div className="font-medium">Isi:</div>
        <code className="block mt-1 p-2 bg-slate-50 rounded border overflow-x-auto">
          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        </code>
      </div>
    )}
  </div>
)

export const renderInputItemContent = ({ item, components }) => {
  const metadata = item?.metadata ?? {}
  const value = item?.value ?? ''
  const type = item?.type || 'text'

  const {
    LinkContent,
    RichTextContent,
    TextContent,
    FormDataContent,
    ImageContent,
    FileContent,
  } = components

  const contentRenderers = {
    link: <LinkContent value={value} />,
    rich_text: <RichTextContent value={value} />,
    text: <TextContent value={value} />,
    form_data: <FormDataContent fields={metadata?.fields} />,
    image: <ImageContent item={item} />,
    file: <FileContent item={item} />,
  }

  return contentRenderers[type] || <DefaultContent type={type} value={value} />
}
