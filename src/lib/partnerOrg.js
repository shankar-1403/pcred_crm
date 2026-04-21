/**
 * Resolve org display names from master lists. Prefer current master `name` when
 * `id` matches (trimmed), then denormalized fields on the lead, then raw id.
 */
export function resolveEliteAmbassadorName(orgId, fallbackName, eliteAmbassadorRows) {
  const id = String(orgId ?? '').trim()
  if (id && Array.isArray(eliteAmbassadorRows)) {
    const row = eliteAmbassadorRows.find(
      (item) => String(item?.id ?? '').trim() === id,
    )
    const n = row?.name != null ? String(row.name).trim() : ''
    if (n) return n
  }
  const fb = String(fallbackName ?? '').trim()
  if (fb) return fb
  if (!id) return ''
  return id
}

export function resolveAmbassadorName(ambassadorId, fallbackName, ambassadorRows) {
  const id = String(ambassadorId ?? '').trim()
  if (id && Array.isArray(ambassadorRows)) {
    const row = ambassadorRows.find(
      (item) => String(item?.id ?? '').trim() === id,
    )
    const n = row?.name != null ? String(row.name).trim() : ''
    if (n) return n
  }
  const fb = String(fallbackName ?? '').trim()
  if (fb) return fb
  if (!id) return ''
  return id
}

export function resolveEliteAmbassadorPhone(orgId, fallbackPhoneNo, eliteAmbassadorRows) {
  const id = String(orgId ?? '').trim()
  if (id && Array.isArray(eliteAmbassadorRows)) {
    const row = eliteAmbassadorRows.find(
      (item) => String(item?.id ?? '').trim() === id,
    )
    const n = row?.phoneNo != null ? String(row.phoneNo).trim() : ''
    if (n) return n
  }
  const fb = String(fallbackPhoneNo ?? '').trim()
  if (fb) return fb
  return ''
}

export function resolveAmbassadorPhone(orgId, fallbackPhoneNo, ambassadorRows) {
  const id = String(orgId ?? '').trim()
  if (id && Array.isArray(ambassadorRows)) {
    const row = ambassadorRows.find(
      (item) => String(item?.id ?? '').trim() === id,
    )
    const n = row?.phoneNo != null ? String(row.phoneNo).trim() : ''
    if (n) return n
  }
  const fb = String(fallbackPhoneNo ?? '').trim()
  if (fb) return fb
  return ''
}