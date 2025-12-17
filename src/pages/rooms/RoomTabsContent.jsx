import React from 'react'
import TopicsTab from './TopicsTab'
import ParticipantsTab from './ParticipantsTab'
import TimelineTab from './TimelineTab'
import SettingsTab from './SettingsTab'

export default function RoomTabsContent() {
  return (
    <>
      <TopicsTab />
      <ParticipantsTab />
      <TimelineTab />
      <SettingsTab />
    </>
  )
}
