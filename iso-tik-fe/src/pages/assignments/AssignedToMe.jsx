import React from 'react'
import AssignmentList from './AssignmentList'

export default function AssignedToMe({ query, page, onPageChange, perPage, currentUser }) {
  return (
    <AssignmentList
      query={query}
      page={page}
      perPage={perPage}
      onPageChange={onPageChange}
      currentUser={currentUser}
      emptyText="Tidak ada penugasan aktif yang ditugaskan ke Anda."
    />
  )
}
