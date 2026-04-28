import { useMemo, useState } from 'react'
import { ref, remove, set, update } from 'firebase/database'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '../context/AuthContext'
import { useAmbassador } from '../hooks/useAmbassador'
import { useEliteAmbassador } from '../hooks/useEliteAmbassador'
import { useUsers } from '../hooks/useUsers'
import { ROLES } from '../constants'
import { db, functions } from '../lib/firebase'
import { isValidPan, normalizePan, panToAuthEmail } from '../lib/panAuth'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import { SALUTATIONS } from '../lib/salutation'

export default function AdminAmbassador() {
  const { user, profile, createUserByAdmin } = useAuth()
  const { ambassador, loading, error } = useAmbassador()
  const {eliteAmbassador} = useEliteAmbassador()
  const { usersById } = useUsers()
  const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

  const [ambassadorName, setAmbassadorName] = useState('')
  const [ambassadorEmail, setAmbassadorEmail] = useState('')
  const [ambassadorPassword, setAmbassadorPassword] = useState('')
  const [ambassadorPan, setAmbassadorPan] = useState('')
  const [ambassadorPhone, setAmbassadorPhone] = useState('')
  const [referredByUid, setReferredByUid] = useState('')
  const [salutationValue, setSalutationValue] = useState('')
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
    return Object.entries(ambassador)
      .map(([uid, u]) => ({ uid, ...u }))
      .filter((u) => {
        const r = String(u?.role ?? '').trim().toLowerCase()
        return (r === ROLES.ELITE_AMBASSADOR)
        
      })
      .sort((a, b) =>
        String(a.displayName || a.email || '')
          .toLowerCase()
          .localeCompare(String(b.displayName || b.email || '').toLowerCase()),
      )
  }, [ambassador])

  function referredByLabel(uid) {
    if (!uid) return '—'
    const u = usersById[uid]
    if (!u) return `${uid.slice(0, 8)}…`
    return u.displayName || u.email || uid.slice(0, 8)
  }

  const sendMail = async ({ email, name, password, pan }) => {
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": import.meta.env.VITE_BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            email: "noreply@pcred.org",
            name: "Pcred Venture",
          },
          to: [{ email }],
          subject: "Welcome to PCRED Venture Pvt.Ltd",
          htmlContent: `
            <a href="https://www.pcred.org/" target="_blank"> 
              <img src="https://www.pcred.org/assets/img/websitelogofinal.png" width="100%" height="100%" style="height:30px;width:110px;"/>
            </a>
            <br/>
            <div>
              <h1 style="font-size:16px;">Welcome to Pcred Venture</h2>
              <p>Hello ${name}</p>
              <p>Login Id (PAN): ${pan}</p>
              <p>Password: ${password}</p>
            </div>
            <br/>
            <p>Regards,<br/>Pcred Team</p>
            <hr/>
            <p style="font-size:12px;color:gray;">This is an automated email. Please do not reply.</p>
          `,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

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

    const salutation = salutationValue.trim()
    const name = ambassadorName.trim()
    const phoneNo = ambassadorPhone
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
    let newUid = null
    let ambassadorWritten = false
    try {
      const refUid = String(referredByUid ?? '').trim() || user.uid
      const authEmail = panToAuthEmail(panNorm)
      const phoneStr = String(phoneNo ?? '').trim()

      newUid = await createUserByAdmin(
        authEmail,
        passwordTrim,
        name,
        ROLES.AMBASSADOR,
        {
          pan: panNorm,
          email: emailTrim,
          phoneNo: phoneStr || null,
          referredByUid: refUid,
        },
      )

      await update(ref(db, `users/${newUid}`), { ambassadorId: newUid })

      await set(ref(db, `ambassador/${newUid}`), {
        salutation,
        name,
        pan: panNorm,
        phoneNo: phoneStr || null,
        email:emailTrim,
        referredByUid: refUid,
        createdAt: Date.now(),
        createdByAdminUid: user.uid,
      })
      ambassadorWritten = true

      // await sendMail({
      //   email: emailTrim,
      //   name,
      //   password: passwordTrim,
      //   pan: panNorm,
      // })
      setSalutationValue('')
      setAmbassadorName('')
      setAmbassadorEmail('')
      setAmbassadorPassword('')
      setAmbassadorPan('')
      setAmbassadorPhone('')
      setReferredByUid(user.uid)
      setMessage(`Ambassador and login added. User UID: ${newUid}`)
    } catch (err) {
      if (ambassadorWritten && newUid) {
        await remove(ref(db, `ambassador/${newUid}`)).catch(() => {})
      }
      if (newUid) {
        await remove(ref(db, `users/${newUid}`)).catch(() => {})
        try {
          const deleteUserByAdmin = httpsCallable(functions, 'deleteUserByAdmin')
          await deleteUserByAdmin({ uid: newUid })
        } catch {
          /* Auth delete may fail if Functions unavailable; profile row already removed */
        }
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

  function getSalutationLabel(id) {
    return SALUTATIONS.find((d) => d.id == id)?.label || "";
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
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className='min-w-0'>
            <label className="block text-sm font-medium text-slate-300">Salutation</label>
            <select
              value={salutationValue}
              onChange={(e) => setSalutationValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              <option value="">-- select --</option>
              {SALUTATIONS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
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
              Phone No.
            </label>
            <input
              type="number"
              required
              value={ambassadorPhone}
              onChange={(e) => setAmbassadorPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
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
              <option value="">-- select --</option>
              {eliteAmbassador.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email || u.id.slice(0, 8)}
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
                <th className="px-4 py-2 font-medium">Phone No.</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Referred by</th>
                <th className="px-4 py-2 font-medium">Ambassador ID</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : ambassadorTable.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No ambassadors yet. Add one above.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((a) => (
                  <tr key={a.id} className="text-slate-300">
                    <td className="px-4 py-2 text-white">{getSalutationLabel(a.salutation)} {a.name || '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-300">{a.pan || '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-300">{a.phoneNo || '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-300">{a.email || '—'}</td>
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
