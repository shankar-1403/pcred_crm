import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileGateMessage from './ProfileGateMessage'

function collectAllowedUids(uid, allowedUids) {
  const out = []
  if (typeof uid === 'string' && uid.trim()) out.push(uid.trim())
  if (Array.isArray(allowedUids)) {
    for (const u of allowedUids) {
      const s = String(u ?? '').trim()
      if (s) out.push(s)
    }
  } else if (typeof allowedUids === 'string' && allowedUids.trim()) {
    out.push(allowedUids.trim())
  }
  return out
}

export default function ProtectedRoute({ children, roles, uid, allowedUids }) {
  const { user, profile, profileIssue, loading, refreshProfile, logout } = useAuth()
  const location = useLocation()
  const signingOutMissingProfileRef = useRef(false)
  useEffect(() => {
    if (!user || profileIssue !== 'missing_profile') return
    if (signingOutMissingProfileRef.current) return

    signingOutMissingProfileRef.current = true
    logout().finally(() => {
      signingOutMissingProfileRef.current = false
    })
  }, [user, profileIssue, logout])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!profile?.role) {
    if (profileIssue === 'missing_profile') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Your account was removed. Redirecting to login…
        </div>
      )
    }
    return (
      <ProfileGateMessage
        uid={user.uid}
        profileIssue={profileIssue}
        onRefresh={refreshProfile}
      />
    )
  }

  const normalizedRole = String(profile.role ?? '').trim().toLowerCase()
  const hasRoleGate = Boolean(roles?.length)
  const uidList = collectAllowedUids(uid, allowedUids)
  const hasUidGate = uidList.length > 0

  if (hasRoleGate || hasUidGate) {
    const roleOk =
      !hasRoleGate || roles.some((allowed) => allowed === normalizedRole)
    const uidOk =
      hasUidGate && Boolean(profile.uid) && uidList.includes(profile.uid)
    if (!roleOk && !uidOk) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
