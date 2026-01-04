export const sampleTopics = [
  {
    id: 't1',
    title: 'Upgrade Firewall Sistem Utama',
    description:
      'Proposal upgrade firewall untuk meningkatkan keamanan sistem utama universitas. Diperlukan persetujuan dari pihak terkait.',
    tags: ['In Review', 'Urgent', 'Security'],
    author: 'Ahmad Fauzi',
    category: 'Keamanan Siber',
    due: '20/12/2024',
    badge: { label: 'Confidential L2', color: 'purple' },
    responsible: { initials: 'SR' },
    updated: '14/12/2024',
  },
  {
    id: 't2',
    title: 'Implementasi Single Sign-On (SSO)',
    description: 'Pengembangan dan implementasi sistem SSO untuk semua aplikasi internal universitas',
    tags: ['Approved', 'Enhancement', 'Security'],
    author: 'Budi Santoso',
    category: 'Pengembangan Aplikasi',
    due: '15/1/2025',
    badge: { label: 'Restricted L1', color: 'teal' },
    responsible: { initials: 'BS' },
    updated: '1/12/2024',
  },
  {
    id: 't3',
    title: 'Maintenance Server Database',
    description: 'Jadwal maintenance rutin untuk optimasi performa database',
    tags: ['Changes Requested', 'Infrastructure'],
    author: 'Rina Wijaya',
    category: 'Infrastruktur & Jaringan',
    due: '18/12/2024',
    badge: { label: 'Restricted L1', color: 'teal' },
    responsible: { initials: 'RW' },
    updated: '12/12/2024',
  },
]

export default sampleTopics
