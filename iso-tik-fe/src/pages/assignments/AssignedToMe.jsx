import React from 'react'
import AssignmentList from './AssignmentList'

export default function AssignedToMe({ query, page, onPageChange, perPage }) {
  return (
    <AssignmentList
      query={query}
      page={page}
      perPage={perPage}
      onPageChange={onPageChange}
      emptyText="Tidak ada penugasan aktif yang ditugaskan ke Anda."
    />
  )
}
