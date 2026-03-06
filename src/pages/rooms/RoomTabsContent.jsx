import React from 'react'
import TopicsTab from './TopicsTab'
import ParticipantsTab from './ParticipantsTab'
import TimelineTab from './TimelineTab'
import SettingsTab from './SettingsTab'
import AttachmentsTab from './AttachmentsTab'

export default function RoomTabsContent({ roomId, room, showTopicsTab = true }) {
  return (
    <>
      {showTopicsTab && <TopicsTab roomId={roomId} />}
      <AttachmentsTab roomId={roomId} />
      <ParticipantsTab roomId={roomId} room={room} />
      <TimelineTab roomId={roomId} />
      <SettingsTab room={room} />
    </>
  )
}
