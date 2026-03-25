import React from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'

// TabsBar: renders a TabsList with triggers so it can be used inside the
// existing <Tabs> provider. Pass `items` to override default tabs.
export default function TabsBar({ items }) {
  const tabs = items ?? [
    { label: 'Overview', value: 'overview' },
    { label: 'Members', value: 'members' },
    { label: 'Rooms', value: 'rooms' },
    { label: 'Labels', value: 'labels' },
    { label: 'Settings', value: 'settings' },
  ]

  return (
    <TabsList className="sticky top-16 z-20 bg-white border-b">
      {tabs.map((t) => (
        <TabsTrigger
          key={t.value}
          value={t.value}
          className="px-4 py-3 text-small text-muted-foreground hover:text-navy-hover focus:text-black focus-visible:text-navy-active data-[state=active]:text-navy-active data-[state=active]:font-semibold"
        >
          <div className="flex items-center gap-2">
            {t.icon ? (
              <span className="inline-flex items-center justify-center text-muted-foreground">{t.icon}</span>
            ) : null}
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span className="inline-flex items-center justify-center text-[11px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{t.count}</span>
            )}
          </div>
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
