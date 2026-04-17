import { useMemo, useState } from 'react'
import { push, ref, remove, set } from 'firebase/database'
import { useAuth } from '../context/AuthContext'
import { useAmbassador } from '../hooks/useAmbassador'
import { useUsers } from '../hooks/useUsers'
import { ROLES } from '../constants'
import { db } from '../lib/firebase'
import { isValidPan, normalizePan, panToAuthEmail } from '../lib/panAuth'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'

export default function AdminAmbassador() {
  const { user, profile, createUserByAdmin } = useAuth()
  const { ambassador, loading, error } = useAmbassador()
  const { usersById } = useUsers()

  const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

  const [ambassadorName, setAmbassadorName] = useState('')
  const [ambassadorEmail, setAmbassadorEmail] = useState('')
  const [ambassadorPassword, setAmbassadorPassword] = useState('')
  const [ambassadorPan, setAmbassadorPan] = useState('')
  const [referredByUid, setReferredByUid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingAmbassadorId, setDeletingAmbassadorId] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const ambassadorTable = useMemo(() => ambassador ?? [], [ambassador])

  const {
    page: tablePage,
    setPage: setTablePage,
    pageSize: tablePageSize,
    setPageSize: setTablePageSize,
    total: tableTotal,
    totalPages: tableTotalPages,
    pageItems: tablePageItems,
  } = usePagination(ambassadorTable)

  const referrerOptions = useMemo(() => {
    return Object.entries(usersById)
      .map(([uid, u]) => ({ uid, ...u }))
      .filter((u) => {
        const r = String(u?.role ?? '').trim().toLowerCase()
        return (
          r === ROLES.MANAGEMENT ||
          r === ROLES.SALES ||
          r === ROLES.PROCESS ||
          r === ROLES.ELITE_AMBASSADOR ||
          r === ROLES.AMBASSADOR
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
        `Current role is "${profile?.role ?? 'missing'}". Only admin can manage ambassadors.`,
      )
      return
    }

    const name = ambassadorName.trim()
    const emailTrim = ambassadorEmail.trim()
    const passwordTrim = ambassadorPassword

    if (!name) {
      setFormError('Ambassador name is required.')
      return
    }
    if (!emailTrim) {
      setFormError('Email is required for the ambassador login.')
      return
    }
    const panNorm = normalizePan(ambassadorPan)
    if (!panNorm) {
      setFormError('PAN is required for ambassador login (sign in with PAN + password).')
      return
    }
    if (!isValidPan(panNorm)) {
      setFormError('PAN must be 10 characters in format ABCDE1234F.')
      return
    }
    if (!passwordTrim || passwordTrim.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    let newAmbassadorId = null
    try {
      const ambassadorRef = push(ref(db, 'ambassador'))
      newAmbassadorId = ambassadorRef.key
      const refUid = String(referredByUid ?? '').trim()
      await set(ambassadorRef, {
        name,
        pan: panNorm,
        referredByUid: refUid || null,
        createdAt: Date.now(),
        createdByAdminUid: user.uid,
      })
      const authEmail = panToAuthEmail(panNorm)
      const uid = await createUserByAdmin(
        authEmail,
        passwordTrim,
        name,
        ROLES.AMBASSADOR,
        {
          ambassadorId: newAmbassadorId,
          pan: panNorm,
          email: emailTrim,
        },
      )
      setAmbassadorName('')
      setAmbassadorEmail('')
      setAmbassadorPassword('')
      setAmbassadorPan('')
      setReferredByUid('')
      setMessage(`Ambassador and login added. User UID: ${uid}`)
    } catch (err) {
      if (newAmbassadorId) {
        await remove(ref(db, `ambassador/${newAmbassadorId}`)).catch(() => {})
      }
      setFormError(err?.message ?? 'Could not add ambassador.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(ambassadorId, label) {
    setMessage('')
    setFormError('')
    if (!isAdmin) {
      setFormError('Only admin can delete ambassadors.')
      return
    }
    const ok = window.confirm(
      `Delete ambassador "${label || ambassadorId}"? Ambassador users linked to this ID will stop matching leads until updated.`,
    )
    if (!ok) return

    setDeletingAmbassadorId(ambassadorId)
    try {
      await remove(ref(db, `ambassador/${ambassadorId}`))
      setMessage('Ambassador deleted.')
    } catch (err) {
      setFormError(err?.message ?? 'Could not delete ambassador.')
    } finally {
      setDeletingAmbassadorId('')
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Ambassador master</h1>
        <p className="mt-1 text-sm text-slate-400">
          Add a ambassador organization and its login in one step. Management uses
          ambassadors on leads; each login sees only leads tagged with that ambassador.
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
            Could not load ambassadors: {String(error?.message ?? error)}
          </p>
        )}
        {!isAdmin && (
          <p className="mt-2 rounded-lg border border-amber-800/70 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            This account cannot edit ambassadors. Sign in as admin.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-medium text-white">Add ambassador</h2>
        <p className="mt-2 text-xs text-slate-500">
          Role for the new account is set to Ambassador and linked to the ambassador
          record below. Sign-in uses PAN and password; email is stored on the profile.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-300">
              Ambassador name
            </label>
            <input type="text" required value={ambassadorName} onChange={(e) => setAmbassadorName(e.target.value)}
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
              value={ambassadorEmail}
              onChange={(e) => setAmbassadorEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              autoComplete="off"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-300">
              PAN (login ID)
            </label>
            <input
              type="text"
              required
              value={ambassadorPan}
              onChange={(e) => setAmbassadorPan(e.target.value.toUpperCase())}
              maxLength={10}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white uppercase"
              placeholder="ABCDE1234F"
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
              value={ambassadorPassword}
              onChange={(e) => setAmbassadorPassword(e.target.value)}
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
              Internal user who sees this ambassador&apos;s new leads on their board.
            </p>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-2 xl:col-span-1">
            <button
              type="submit"
              disabled={submitting || !isAdmin}
              className="w-full rounded-lg bg-blue-600 px-4 mt-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 lg:w-auto"
            >
              {submitting ? 'Saving…' : 'Add ambassador & account'}
            </button>
          </div>
        </form>
        {formError && <p className="text-sm text-red-300">{formError}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}
      </section>

      <section className="max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-300">Ambassadors</h2>
        </div>
        <div className="min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px] table-auto text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">PAN</th>
                <th className="px-4 py-2 font-medium">Referred by</th>
                <th className="px-4 py-2 font-medium">Ambassador ID</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : ambassadorTable.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No ambassadors yet. Add one above.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((a) => (
                  <tr key={a.id} className="text-slate-300">
                    <td className="px-4 py-2 text-white">{a.name || '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-300">
                      {a.pan || '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-400">
                      {referredByLabel(a.referredByUid)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">
                      {a.id}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id, a.name)}
                        disabled={!isAdmin || deletingAmbassadorId === a.id}
                        className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                      >
                        {deletingAmbassadorId === a.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && !error && ambassadorTable.length > 0 ? (
          <TablePagination
            page={tablePage}
            totalPages={tableTotalPages}
            totalItems={tableTotal}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            onPageSizeChange={setTablePageSize}
          />
        ) : null}
      </section>
    </div>
  )
}
