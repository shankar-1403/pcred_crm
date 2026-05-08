import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ref, remove, set, update } from 'firebase/database'
import { httpsCallable } from 'firebase/functions'
import ModalCloseButton from '../components/ModalCloseButton'
import TablePagination from '../components/TablePagination'
import { usePagination } from '../hooks/usePagination'
import { ROLE_LABELS, ROLES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useUsers } from '../hooks/useUsers'
import { db, functions } from '../lib/firebase'
import { auth } from '../lib/firebase'

/** Team roles assignable when creating a user (elite / ambassador logins use their master screens). */
const teamRoleOptionsCreate = [
  ROLES.MANAGEMENT,
  ROLES.SALES,
  ROLES.PROCESS,
  ROLES.EMPLOYEES,
]

const EDIT_ROLE_ORDER = [
  ROLES.MANAGEMENT,
  ROLES.SALES,
  ROLES.PROCESS,
  ROLES.EMPLOYEES,
]

function teamRoleOptionsForEdit(currentRole) {
  const r = String(currentRole ?? '').trim().toLowerCase()
  if (r && !EDIT_ROLE_ORDER.includes(r)) {
    return [...EDIT_ROLE_ORDER, r]
  }
  return EDIT_ROLE_ORDER
}

export default function AdminUsers() {
  const { createUserByAdmin, user, profile } = useAuth()
  const { usersById, loading } = useUsers()
  const isAdmin = String(profile?.role ?? '').trim().toLowerCase() === ROLES.ADMIN

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingUid, setDeletingUid] = useState('')
  const [editingUid, setEditingUid] = useState('')
  const [editForm, setEditForm] = useState({
    displayName: '',
    email:'',
    role: '',
  })
  const [editPassword, setEditPassword] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const users = useMemo(() => {
    return Object.entries(usersById)
      .map(([uid, u]) => ({ uid, ...u }))
      .filter(
        (u) => String(u?.role ?? '').trim().toLowerCase() !== ROLES.ADMIN,
      )
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  }, [usersById])

  const {
    page: tablePage,
    setPage: setTablePage,
    pageSize: tablePageSize,
    setPageSize: setTablePageSize,
    total: tableTotal,
    totalPages: tableTotalPages,
    pageItems: tablePageItems,
  } = usePagination(users)

  async function handleCreate(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!isAdmin) {
      setError(
        `Current account is not admin (role: ${profile?.role || 'missing'}). Set users/${user?.uid}/role to "admin" and re-login.`,
      )
      return
    }
    const emailTrim = email.trim()
    const displayTrim = displayName.trim()
    setSubmitting(true)
    try {
      const uid = await createUserByAdmin(
        emailTrim,
        password,
        displayTrim,
        role,
        {},
      )
      setMessage(`User created successfully. UID: ${uid}`)
      setEmail('')
      setPassword('')
      setDisplayName('')
      setRole('')
    } catch (err) {
      setError(err?.message || 'Could not create user')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteUser(targetUid) {
    setMessage('')
    setError('')
    if (!isAdmin) {
      setError('Only admin can delete users.')
      return
    }
    if (!targetUid || targetUid === user?.uid) {
      setError('You cannot delete the currently logged-in admin user.')
      return
    }
    const ok = window.confirm(
      'Delete this user account? This removes both Authentication user and profile data.',
    )
    if (!ok) return

    setDeletingUid(targetUid)
    try {
      const deleteUserByAdmin = httpsCallable(functions, 'deleteUserByAdmin')
      await deleteUserByAdmin({ uid: targetUid })
      setMessage('User deleted from Authentication and Database.')
    } catch (err) {
      // Fallback for Spark plan / function not deployed / CORS from missing endpoint.
      // Still remove profile row so deleted users cannot access app screens.
      try {
        await remove(ref(db, `users/${targetUid}`))
        setMessage(
          'Profile deleted from Database. Auth user could not be deleted (enable/deploy Cloud Functions on Blaze plan).',
        )
      } catch {
        const msg =
          err?.message ||
          err?.details ||
          'Could not delete user from Authentication or Database.'
        setError(String(msg))
      }
    } finally {
      setDeletingUid('')
    }
  }

  function openEdit(u) {
    setMessage('')
    setError('')
    setEditingUid(u?.uid || '')
    setEditForm({
      displayName: u?.displayName ?? '',
      email: u?.email ?? '',
      role: String(u?.role).trim().toLowerCase(),
    })
    setEditPassword('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (!isAdmin) {
      setError('Only admin can edit users.')
      return
    }
    if (!editingUid) return

    const nextRole = String(editForm.role ?? '').trim().toLowerCase()
    const nextEmail = String(editForm.email ?? '').trim().toLowerCase()
    const nextDisplayName = String(editForm.displayName ?? '').trim()
    const nextPassword = String(editPassword ?? '').trim()

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
            email: nextEmail,
            password: nextPassword || undefined,
            displayName: nextDisplayName,
          }),
        },
      )

      await update(ref(db, `users/${editingUid}`), {
        displayName: nextDisplayName,
        email: nextEmail,
        role: nextRole,
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

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">User management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Admin creates user accounts and assigns the team role.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Create sales, process, or management team members here. Elite ambassador and
          ambassador logins are created from{' '}
          <Link to="/admin/elite-ambassador" className="text-blue-300 hover:underline">
            Elite ambassador master
          </Link>{' '}
          and{' '}
          <Link to="/admin/ambassador" className="text-blue-300 hover:underline">
            Ambassador master
          </Link>
          .
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-lg font-medium text-white">Create account</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Team</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              <option value="">-- select --</option>
              {teamRoleOptionsCreate.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
            {error && <p className="text-sm text-red-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            <button
              type="submit"
              disabled={submitting || !isAdmin}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-full min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 [-webkit-overflow-scrolling:touch]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-195 table-auto text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Email</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">Team</th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">UID</th>
                <th className="px-4 py-2 font-medium text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                tablePageItems.map((u) => (
                  <tr key={u.uid} className="text-slate-300">
                    <td className="px-4 py-1 text-white">
                      {u.displayName || u.email || '—'}
                    </td>
                    <td className="px-4 py-1 text-slate-400">{u.email || '—'}</td>
                    <td className="px-4 py-1 text-slate-400">
                      {ROLE_LABELS[u.role] || u.role || '—'}
                    </td>
                    <td className="px-4 py-1 font-mono text-xs text-slate-500">
                      {u.uid}
                    </td>
                    <td className="px-4 py-1 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          disabled={!isAdmin}
                          className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.uid)}
                          disabled={
                            !isAdmin || deletingUid === u.uid || u.uid === user?.uid
                          }
                          className="rounded-lg border border-red-800/60 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            u.uid === user?.uid
                              ? 'Cannot delete currently logged-in admin'
                              : 'Delete user'
                          }
                        >
                          {deletingUid === u.uid ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && users.length > 0 ? (
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
                <h2 className="text-lg font-semibold text-white">Edit user</h2>
                <p className="mt-1 text-xs text-slate-400">
                  UID: <code className="font-mono text-slate-300">{editingUid}</code>
                </p>
              </div>
              <ModalCloseButton onClick={() => setEditingUid('')} />
            </div>

            <form onSubmit={saveEdit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Display name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Email Id
                </label>
                <input
                  type="text"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Team
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  {teamRoleOptionsForEdit(editForm.role).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">
                  New password (optional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Password must be at least 6 characters if provided.
                </p>
              </div>

              {String(editForm.role).trim().toLowerCase() === ROLES.ELITE_AMBASSADOR && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Elite ambassador ID (optional)
                    </label>
                    <Link
                      to="/admin/elite-ambassador"
                      className="text-xs text-blue-300 hover:underline"
                    >
                      Open Elite ambassador master
                    </Link>
                  </div>
                  <input
                    type="text"
                    value={editForm.eliteAmbassadorId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, eliteAmbassadorId: e.target.value }))
                    }
                    placeholder="Leave blank to auto-create"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    If blank, a new elite ambassador record will be created automatically on save.
                  </p>
                </div>
              )}

              {String(editForm.role).trim().toLowerCase() === ROLES.AMBASSADOR && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Ambassador ID (optional)
                    </label>
                    <Link
                      to="/admin/ambassador"
                      className="text-xs text-blue-300 hover:underline"
                    >
                      Open Ambassador master
                    </Link>
                  </div>
                  <input
                    type="text"
                    value={editForm.ambassadorId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, ambassadorId: e.target.value }))
                    }
                    placeholder="Leave blank to auto-create"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    If blank, a new ambassador record will be created automatically on save.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-300">{error}</p>}
              {message && <p className="text-sm text-emerald-300">{message}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUid('')}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAdmin || savingEdit}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
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
