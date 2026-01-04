import React from 'react'
import AssignmentList from './AssignmentList'

export default function AllAssignments({ query, page, onPageChange, perPage }) {
  return (
    <AssignmentList
      query={query}
      page={page}
      perPage={perPage}
      onPageChange={onPageChange}
      emptyText="Belum ada penugasan yang tersedia untuk ruang yang Anda akses."
    />
  )
}
