/**
 * Map lead.status (DB) → human-readable label. Keys match Firebase status row `id`
 * and optional legacy slug in `value`, same as LeadDetailsModal.
 */
export function statusLabelMapFromStatuses(statuses) {
  const m = new Map()
  for (const s of statuses || []) {
    const label = String(s?.label ?? '').trim()
    if (!label) continue
    const id = String(s?.id ?? '').trim()
    const legacyValue = String(s?.value ?? '').trim()
    if (id) m.set(id, label)
    if (legacyValue) m.set(legacyValue, label)
  }
  return m
}

export function labelForLeadStatus(map, status) {
  const raw = String(status ?? '').trim()
  if (!raw) return ''
  return map.get(raw) || raw
}
