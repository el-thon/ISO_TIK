export const currentUser = {
  name: 'Siti Rahayu',
  email: 'siti.rahayu@university.ac.id',
  initials: 'SR',
}

export const sampleAssignments = [
  {
    id: 'a1',
    title: 'Upgrade Firewall Sistem Utama',
    category: 'Keamanan Siber',
    from: { name: 'Siti Rahayu', initials: 'SR', email: 'siti.rahayu@university.ac.id' },
    to: { name: 'Ahmad Fauzi', initials: 'AF', email: 'ahmad.fauzi@university.ac.id' },
    status: 'pending',
    due: '2024-12-12',
    tag: 'return to sender',
    note: 'Harap lengkapi analisis cost-benefit',
    createdAt: '2023-12-12'
  },
  {
    id: 'a2',
    title: 'Maintenance Server Database',
    category: 'Infrastruktur & Jaringan',
    from: { name: 'Siti Rahayu', initials: 'SR', email: 'siti.rahayu@university.ac.id' },
    to: { name: 'Rina Wijaya', initials: 'RW', email: 'rina.wijaya@university.ac.id' },
    status: 'pending',
    due: '2024-12-12',
    tag: 'return to sender',
    note: 'Reschedule maintenance window',
    createdAt: '2023-12-12'
  },
  {
    id: 'a3',
    title: 'Upgrade Firewall Sistem Utama',
    category: 'Keamanan Siber',
    from: { name: 'Ahmad Fauzi', initials: 'AF', email: 'ahmad.fauzi@university.ac.id' },
    to: { name: 'Siti Rahayu', initials: 'SR', email: 'siti.rahayu@university.ac.id' },
    status: 'completed',
    due: '2024-10-12',
    tag: 'forward to reviewer',
    note: 'Completed by team',
    createdAt: '2023-12-12'
  },
]
