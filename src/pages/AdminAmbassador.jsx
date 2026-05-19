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
import ModalCloseButton from '../components/ModalCloseButton'

export default function AdminAmbassador() {
  const { user, profile, createUserByAdmin } = useAuth()
  const { ambassador, loading, error } = useAmbassador()
  const {eliteAmbassador} = useEliteAmbassador()
  const { usersById } = useUsers()

  const [ambassadorName, setAmbassadorName] = useState('')
  const [ambassadorDob, setAmbassadorDob] = useState('')
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
  const [modalError, setModalError] = useState('')
  const [editingUid, setEditingUid] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    dob:'',
    pan:'',
    email:'',
    phoneNo: '',
  })

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
          salutation: salutation || null,
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
      setReferredByUid('')
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

  function openEdit(a) {
    setMessage('')
    setModalError('')
    setEditingUid(a?.id || '')
    setEditForm({
      name: a?.name ?? '',
      dob: a?.dob ?? '',
      email: a?.email ?? '',
      pan: a?.pan ?? '',
      phoneNo: a?.phoneNo ?? '',
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setMessage('')
    setModalError('')
    
    if (!editingUid) return

    const nextDisplayName = String(editForm.name ?? '').trim()
    const nextDob = String(editForm.dob ?? '').trim()
    const nextEmail = String(editForm.email ?? '').trim()
    const nextPan = String(editForm.pan ?? '').trim()
    const nextPhoneNo = String(editForm.phoneNo ?? '').trim()
    setSavingEdit(true)
    try {
      await fetch(
        'https://us-central1-crm-lead-b18f5.cloudfunctions.net/updateUserByAdmin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: editingUid,
            displayName: nextDisplayName,
            dob:nextDob,
            email:nextEmail,
            pan: nextPan,
            email: nextEmail,
            phoneNo: nextPhoneNo,
          }),
        },
      )

      await update(ref(db, `ambassador/${editingUid}`), {
        name: nextDisplayName,
        dob: nextDob,
        email:nextEmail,
        pan: nextPan,
        phoneNo: nextPhoneNo,
        updatedAt: Date.now(),
        updatedByAdminUid: user?.uid ?? null,
      })

      setMessage('User updated.')
      setEditingUid('')
    } catch (err) {
      const code = err?.code
      const details = err?.details
      const msg = err?.message || 'Could not update user.'
      setError(
        [code, details, msg]
          .filter(Boolean)
          .join(' — '),
      )
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete(ambassadorId, label) {
    setMessage('')
    setFormError('')

    const ok = window.confirm(
      `Delete ambassador "${label || ambassadorId}"? Ambassador users linked to this ID will stop matching leads until updated.`,
    )
    if (!ok) return

    setDeletingAmbassadorId(ambassadorId)
    try {
      await fetch(
        'https://us-central1-crm-lead-b18f5.cloudfunctions.net/deleteUserByAdmin',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: ambassadorId,
          }),
        },
      )
      await remove(ref(db, `ambassador/${ambassadorId}`))
      await remove(ref(db, `users/${ambassadorId}`))
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
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-medium text-white">Add ambassador</h2>
        <p className="mt-2 text-xs text-slate-500">
          Role for the new account is set to Ambassador and linked to the ambassador
          record below. Sign-in uses PAN and password; email is stored on the profile.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <label className="block text-sm font-medium text-slate-300">Date of birth</label>
            <input
              type="date"
              required
              value={ambassadorDob}
              onChange={(e) => setAmbassadorDob(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
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
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 mt-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 lg:w-auto"
            >
              {submitting ? 'Saving…' : 'Add ambassador'}
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
          <table className="w-full min-w-180 table-auto text-left text-xs sm:text-sm">
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
                      <div className="flex gap-4">
                        <div>
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id, a.name)}
                            disabled={deletingAmbassadorId === a.id}
                            className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                          >
                            {deletingAmbassadorId === a.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
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
      {editingUid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Edit Elite Ambassador</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    UID: <code className="font-mono text-slate-300">{editingUid}</code>
                  </p>
                </div>
                <ModalCloseButton onClick={() => setEditingUid('')} />
              </div>

              <form onSubmit={saveEdit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Display name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Date of birth</label>
                  <input type="date" value={editForm.dob} onChange={(e) => setEditForm((f) => ({ ...f, dob: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">PAN</label>
                  <input type="text" value={editForm.pan} onChange={(e) => setEditForm((f) => ({ ...f, pan: e.target.value }))}className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Email Id</label>
                  <input type="text" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Phone No</label>
                  <input type="text" value={editForm.phoneNo} onChange={(e) => setEditForm((f) => ({ ...f, phoneNo:e.target.value}))}className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" maxLength={10}/>
                </div>
                {modalError && <p className="text-sm text-red-300">{modalError}</p>}
                {message && <p className="text-sm text-emerald-300">{message}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUid('')}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                  >
                    {savingEdit ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}
    </div>
  )
}
