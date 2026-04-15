import { useMemo, useState } from 'react'
import { push, ref, remove, set } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { usePartners } from '../hooks/usePartners'
import { useUsers } from '../hooks/useUsers'
import { ROLES } from '../constants'
import { db } from '../lib/firebase'

export default function AdminPartners() {
  const { user, profile, createUserByAdmin } = useAuth()
  const { partners, loading, error } = usePartners()
  const { usersById } = useUsers()

  const isAdmin =
    String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerPassword, setPartnerPassword] = useState('')
  const [referredByUid, setReferredByUid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingPartnerId, setDeletingPartnerId] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const partnersTable = useMemo(() => partners ?? [], [partners])

  const referrerOptions = useMemo(() => {
    return Object.entries(usersById)
      .map(([uid, u]) => ({ uid, ...u }))
      .filter((u) => {
        const r = String(u?.role ?? '').trim().toLowerCase()
        return (
          r === ROLES.MANAGEMENT ||
          r === ROLES.SALES ||
          r === ROLES.PROCESS
        )
      })
      .sort((a, b) =>
        String(a.displayName || a.email || '')
          .toLowerCase()
          .localeCompare(String(b.displayName || b.email || '').toLowerCase()),
      )
  }, [usersById])

  function referredByLabel(uid) {
    if (!uid) return '—'
    const u = usersById[uid]
    if (!u) return `${uid.slice(0, 8)}…`
    return u.displayName || u.email || uid.slice(0, 8)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setMessage('')
    setFormError('')

    if (!user) {
      setFormError('You must be logged in.')
      return
    }
    if (!isAdmin) {
      setFormError(
        `Current role is "${profile?.role ?? 'missing'}". Only admin can manage partners.`,
      )
      return
    }

    const name = partnerName.trim()
    const emailTrim = partnerEmail.trim()
    const passwordTrim = partnerPassword

    if (!name) {
      setFormError('Partner name is required.')
      return
    }
    if (!emailTrim) {
      setFormError('Email is required for the partner login.')
      return
    }
    if (!passwordTrim || passwordTrim.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    let newPartnerId = null
    try {
      const partnerRef = push(ref(db, 'partners'))
      newPartnerId = partnerRef.key
      const refUid = String(referredByUid ?? '').trim()
      await set(partnerRef, {
        name,
        referredByUid: refUid || null,
        createdAt: Date.now(),
        createdByAdminUid: user.uid,
      })
      const uid = await createUserByAdmin(
        emailTrim,
        passwordTrim,
        name,
        ROLES.PARTNER,
        { partnerId: newPartnerId },
      )
      setPartnerName('')
      setPartnerEmail('')
      setPartnerPassword('')
      setReferredByUid('')
      setMessage(`Partner and login added. User UID: ${uid}`)
    } catch (err) {
      if (newPartnerId) {
        await remove(ref(db, `partners/${newPartnerId}`)).catch(() => {})
      }
      setFormError(err?.message ?? 'Could not add partner.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(partnerId, label) {
    setMessage('')
    setFormError('')
    if (!isAdmin) {
      setFormError('Only admin can delete partners.')
      return
    }
    const ok = window.confirm(
      `Delete partner "${label || partnerId}"? Partner users linked to this ID will stop matching leads until updated.`,
    )
    if (!ok) return

    setDeletingPartnerId(partnerId)
    try {
      await remove(ref(db, `partners/${partnerId}`))
      setMessage('Partner deleted.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not delete partner.')
    } finally {
      setDeletingPartnerId('')
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Partner master</h1>
        <p className="mt-1 text-sm text-slate-400">
          Add a partner organization and its login in one step. Management uses
          partners on leads; each login sees only leads tagged with that partner.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
        <p className="text-slate-400">
          Current UID:{' '}
          <code className="font-mono text-blue-300">{user?.uid || '—'}</code>
        </p>
        <p className="mt-1 text-slate-400">
          Current role:{' '}
          <code className="text-blue-300">{profile?.role || 'missing'}</code>
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-300">
            Could not load partners: {String(error?.message ?? error)}
          </p>
        )}
        {!isAdmin && (
          <p className="mt-2 rounded-lg border border-amber-800/70 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            This account cannot edit partners. Sign in as admin.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-medium text-white">Add partner</h2>
        <p className="mt-2 text-xs text-slate-500">
          Role for the new account is set to Partner and linked to the partner
          record below.
        </p>
        <form
          onSubmit={handleCreate}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-300">
              Partner name
            </label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              placeholder="e.g. Acme Finance"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-300">
              Login email
            </label>
            <input
              type="email"
              required
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              autoComplete="off"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={partnerPassword}
              onChange={(e) => setPartnerPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              autoComplete="new-password"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-300">
              Referred by
            </label>
            <select
              value={referredByUid}
              onChange={(e) => setReferredByUid(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              <option value="">Not set</option>
              {referrerOptions.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName || u.email || u.uid.slice(0, 8)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Internal user who sees this partner&apos;s new leads on their board.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-3 sm:col-span-2 lg:col-span-1">
            {formError && <p className="text-sm text-red-300">{formError}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            <button
              type="submit"
              disabled={submitting || !isAdmin}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 lg:w-auto"
            >
              {submitting ? 'Saving…' : 'Add partner & account'}
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-300">Partners</h2>
        </div>
        <div className="min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[640px] table-auto text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Referred by</th>
                <th className="px-4 py-2 font-medium">Partner ID</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : partnersTable.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No partners yet. Add one above.
                  </td>
                </tr>
              ) : (
                partnersTable.map((p) => (
                  <tr key={p.id} className="text-slate-300">
                    <td className="px-4 py-2 text-white">{p.name || '—'}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {referredByLabel(p.referredByUid)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">
                      {p.id}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={!isAdmin || deletingPartnerId === p.id}
                        className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                      >
                        {deletingPartnerId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
