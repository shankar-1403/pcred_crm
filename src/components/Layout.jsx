import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES, ROLE_LABELS } from '../constants'
import { IconLinkFilled,IconUserFilled,IconMenu2 } from '@tabler/icons-react'

const linkClass = ({ isActive }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white',
  ].join(' ')

export default function Layout() {
  const { profile, logout } = useAuth()
  const [textCopied, setTextCopied] = useState("");
  const role = String(profile?.role ?? '').trim().toLowerCase()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }
  function closeProfile() {
    setProfileOpen(false)
  }
  const handleCopy = async () => {
    const uid = profile?.uid
    if (!uid) return
    const base =
      (typeof import.meta.env.VITE_HOST === 'string' && import.meta.env.VITE_HOST.trim()) ||
      window.location.origin
    const url = `${base.replace(/\/$/, '')}/lead/loan/${encodeURIComponent(uid)}`
    await navigator.clipboard.writeText(url)
    setTextCopied("Copied Successfully")
    setTimeout(()=>{
      setTextCopied("")
    },3000)
  }
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-350 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <NavLink
              to="/"
              onClick={closeMenu}
              className="flex items-center text-lg font-semibold tracking-tight text-white"
            >
              <img
                src="/pcred-logo.png"
                alt="Pcred logo"
                className="h-10 object-contain mix-blend-screen"
              />
            </NavLink>
            <div className="lg:hidden items-center gap-2 flex">
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                {ROLE_LABELS[role] ?? role}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <IconMenu2 color='white' size={20}/> : <IconMenu2 color='white' size={20}/>}
              </button>
            </div>
            <div className="hidden lg:flex items-center justify-between gap-4 w-full">
              <nav className="flex flex-wrap gap-1">
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/users" className={linkClass} onClick={closeMenu}>
                    User management
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/products" className={linkClass} onClick={closeMenu}>
                    Product master
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink
                    to="/admin/elite-ambassador"
                    className={linkClass}
                    onClick={closeMenu}
                  >
                    Elite ambassador master
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/ambassador" className={linkClass} onClick={closeMenu}>
                    Ambassador master
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/statuses" className={linkClass} onClick={closeMenu}>
                    Status master
                  </NavLink>
                )}
                {role === ROLES.MANAGEMENT && (
                  <NavLink to="/management" className={linkClass} onClick={closeMenu}>
                    All leads
                  </NavLink>
                )}
                {role === ROLES.SALES && (
                  <NavLink to="/sales" className={linkClass} onClick={closeMenu}>
                    My leads
                  </NavLink>
                )}
                {role === ROLES.PROCESS && (
                  <NavLink to="/process" className={linkClass} onClick={closeMenu}>
                    Assigned leads
                  </NavLink>
                )}
                {role === ROLES.ELITE_AMBASSADOR && (
                  <NavLink
                    to="/elite-ambassador"
                    className={linkClass}
                    onClick={closeMenu}
                  >
                    Elite ambassador dashboard
                  </NavLink>
                )}
                {role === ROLES.AMBASSADOR && (
                  <NavLink to="/ambassador" className={linkClass} onClick={closeMenu}>
                    Ambassador dashboard
                  </NavLink>
                )}
                {[ROLES.SALES,ROLES.PROCESS,ROLES.MANAGEMENT,ROLES.ELITE_AMBASSADOR].includes(role) && (
                    <NavLink to="/ambassadors-list" className={linkClass} onClick={closeMenu}>
                      Ambassadors List
                    </NavLink>
                  )}
                {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                  <NavLink to="/certificate" className={linkClass} onClick={closeMenu}>
                    Certificate
                  </NavLink>
                )}
                {[ROLES.ADMIN].includes(role) && (
                  <NavLink to="/creative" className={linkClass} onClick={closeMenu}>
                    Creative
                  </NavLink>
                )}
                {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                  <NavLink to="/sales-material" className={linkClass} onClick={closeMenu}>
                    Sales Material
                  </NavLink>
                )}
                {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                  <NavLink to="/visiting-card" className={linkClass} onClick={closeMenu}>
                    Visiting Card
                  </NavLink>
                )}
              </nav>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
                {textCopied &&
                  <span className='text-green-500 text-sm'>{textCopied}</span>
                }
                {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                  <button onClick={handleCopy} className='cursor-pointer' title='Magic Link'>
                    <IconLinkFilled size={20} color='#ffffff'/>
                  </button>
                )}
                <button type="button" onClick={() => setProfileOpen((v) => !v)} className='cursor-pointer rounded-full border border-blue-600 p-2 text-sm font-medium hidden lg:block transition-colors'>
                  <IconUserFilled size={20} className='white'/>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-x-0 top-16 left-300 z-40 p-2">
                      <div className="flex flex-col space-y-3 w-70 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl">
                        <span className="w-full text-center text-lg font-bold">
                          {profile?.displayName ?? profile?.email}
                        </span>
                        <span className="w-full text-center">
                          {ROLE_LABELS[role] ?? role}
                        </span>
                        <button type="button" onClick={() => {closeMenu(),logout()}} className="rounded-lg border border-red-500/50 px-2 py-1 text-slate-300 bg-red-500/20 cursor-pointer transition-colors hover:border-slate-500 hover:bg-slate-800">
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 px-3 lg:hidden">
          <div className="mx-auto max-w-350 space-y-3 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl">
            <nav className="grid gap-1">
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/users" className={linkClass} onClick={closeMenu}>
                  User management
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/products" className={linkClass} onClick={closeMenu}>
                  Product master
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink
                  to="/admin/elite-ambassador"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Elite ambassador master
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/ambassador" className={linkClass} onClick={closeMenu}>
                  Ambassador master
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/statuses" className={linkClass} onClick={closeMenu}>
                  Status master
                </NavLink>
              )}
              {role === ROLES.MANAGEMENT && (
                <NavLink to="/management" className={linkClass} onClick={closeMenu}>
                  All leads
                </NavLink>
              )}
              {role === ROLES.SALES && (
                <NavLink to="/sales" className={linkClass} onClick={closeMenu}>
                  My leads
                </NavLink>
              )}
              {role === ROLES.PROCESS && (
                <NavLink to="/process" className={linkClass} onClick={closeMenu}>
                  Assigned leads
                </NavLink>
              )}
              {role === ROLES.ELITE_AMBASSADOR && (
                <NavLink
                  to="/elite-ambassador"
                  className={linkClass}
                  onClick={closeMenu}
                >
                  Elite ambassador dashboard
                </NavLink>
              )}
              {role === ROLES.AMBASSADOR && (
                <NavLink to="/ambassador" className={linkClass} onClick={closeMenu}>
                  Ambassador dashboard
                </NavLink>
              )}
              {[ROLES.SALES,ROLES.PROCESS,ROLES.MANAGEMENT,ROLES.ELITE_AMBASSADOR].includes(role) && (
                  <NavLink to="/ambassadors-list" className={linkClass} onClick={closeMenu}>
                    Ambassadors List
                  </NavLink>
                )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/certificate" className={linkClass} onClick={closeMenu}>
                  Certificate
                </NavLink>
              )}
              {[ROLES.ADMIN].includes(role) && (
                <NavLink to="/creative" className={linkClass} onClick={closeMenu}>
                  Creative
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/sales-material" className={linkClass} onClick={closeMenu}>
                  Sales Material
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/visiting-card" className={linkClass} onClick={closeMenu}>
                  Visiting Card
                </NavLink>
              )}
            </nav>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <span className="truncate text-xs text-slate-400">
                {profile?.displayName ?? profile?.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  logout()
                }}
                className="shrink-0 rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="mx-auto min-w-0 max-w-[1400px] px-3 pb-5 pt-24 sm:px-4 sm:pb-8 sm:pt-28">
        <Outlet />
      </main>
    </div>
  )
}
