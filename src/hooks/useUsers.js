import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../lib/firebase'
import { ROLES } from '../constants'

export function useUsers() {
  const [usersById, setUsersById] = useState({})
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const r = ref(db, 'users')
    const unsub = onValue(
      r,
      (snap) => {
        const v = snap.val()
        const list = v
          ? Object.entries(v).map(([id, data]) => ({ id, ...data }))
          : []
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        setUsers(list);
        setUsersById(snap.val() ?? {})
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error(
          '[CRM] users read denied — rules must allow auth users to read /users (see database.rules.json).',
          err,
        )
        setUsers([]);
        setUsersById({})
        setError(err)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const processUsers = Object.entries(usersById)
    .filter(([, u]) => {
      const role = String(u?.role ?? '')
        .trim()
        .toLowerCase()
      return role === ROLES.PROCESS
    })
    .map(([uid, u]) => ({ uid, ...u }))

  const salesUsers = Object.entries(usersById)
    .filter(([, u]) => {
      const role = String(u?.role ?? '')
        .trim()
        .toLowerCase()
      return role === ROLES.SALES
    })
    .map(([uid, u]) => ({ uid, ...u }))

    const managementUsers = Object.entries(usersById)
      .filter(([, u]) => {
        const role = String(u?.role ?? '')
          .trim()
          .toLowerCase()
        return role === ROLES.MANAGEMENT
      })
      .map(([uid, u]) => ({ uid, ...u }))

  return { users, usersById, processUsers, salesUsers, managementUsers, loading, error }
}