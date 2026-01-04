import React from 'react'
import AssignmentList from './AssignmentList'

export default function AssignedByMe({ query, page, onPageChange, perPage }) {
  return (
    <AssignmentList
      query={query}
      page={page}
      perPage={perPage}
      onPageChange={onPageChange}
      emptyText="Anda belum pernah menugaskan topik ke anggota lain."
    />
  )
}
