import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../lib/firebase'

export function useEliteAmbassador() {
  const [eliteAmbassador, setEliteAmbassador] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const r = ref(db, 'elite_ambassador')
    const unsub = onValue(
      r,
      (snap) => {
        const v = snap.val()
        const list = v
          ? Object.entries(v).map(([id, data]) => ({ id, ...data }))
          : []
        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        setEliteAmbassador(list)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setEliteAmbassador([])
        setError(err)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  return { eliteAmbassador, loading, error }
}
