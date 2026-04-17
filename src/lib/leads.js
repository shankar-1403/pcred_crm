export function assignedUids(assignedTo) {
  if (!assignedTo) return []
  if (Array.isArray(assignedTo)) return assignedTo.filter(Boolean)
  return Object.keys(assignedTo).filter((uid) => assignedTo[uid])
}

/** Elite ambassador master row or lead row: internal user who referred / sees the lead. */
export function normalizedReferredByUid(record) {
  return String(record?.referredByUid ?? '').trim()
}

export function leadReferredToUser(lead, userUid) {
  if (!userUid) return false
  return normalizedReferredByUid(lead) === userUid
}

export function toAssignedMap(uids) {
  const m = {}
  for (const uid of uids) m[uid] = true
  return m
}
