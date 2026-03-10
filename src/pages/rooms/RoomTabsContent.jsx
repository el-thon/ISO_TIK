import React from 'react'
import TopicsTab from './TopicsTab'
import ParticipantsTab from './ParticipantsTab'
import TimelineTab from './TimelineTab'
import SettingsTab from './SettingsTab'
import AttachmentsTab from './AttachmentsTab'

export default function RoomTabsContent({ roomId, room, isRoomOwner = false }) {
  return (
    <>
      <TopicsTab roomId={roomId} />
      <AttachmentsTab roomId={roomId} />
      <ParticipantsTab roomId={roomId} room={room} />
      {isRoomOwner && <SettingsTab room={room} />}
    </>
  )
}
