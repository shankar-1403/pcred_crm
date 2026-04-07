export const ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  SALES: 'sales',
  PROCESS: 'process',
  PARTNER: 'partner',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGEMENT]: 'Management',
  [ROLES.SALES]: 'Sales',
  [ROLES.PROCESS]: 'Process',
  [ROLES.PARTNER]: 'Partner',
}

export const LEAD_STATUSES = [
  { value: '', label: 'Select Status' },
  { value: 'doc_received', label: 'Doc. Received' },
  { value: 'doc_partially_received', label: 'Doc. Partially Rec.' },
  { value: 'login', label: 'LogIn' },
  { value: 'in_process', label: 'In Process' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disbursed', label: 'Disbursed' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'on_hold', label: 'On Hold' },
]
