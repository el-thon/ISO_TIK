import React from 'react'
import TopicsTab from './TopicsTab'
import ParticipantsTab from './ParticipantsTab'
import TimelineTab from './TimelineTab'
import SettingsTab from './SettingsTab'

export default function RoomTabsContent({ roomId, room }) {
  return (
    <>
      <TopicsTab roomId={roomId} />
      <ParticipantsTab roomId={roomId} room={room} />
      <TimelineTab roomId={roomId} />
      <SettingsTab room={room} />
    </>
  )
}
