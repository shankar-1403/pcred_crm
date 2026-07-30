import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../lib/firebase'

export function useSubStatus() {
  const [subStatus, setSubStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const r = ref(db, 'sub_status')
    const unsub = onValue(
      r,
      (snap) => {
        const v = snap.val()
        const list = v
          ? Object.entries(v).map(([id, data]) => ({ id, ...data }))
          : []
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        setSubStatus(list)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setSubStatus([])
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  return { subStatus, loading, error }
}