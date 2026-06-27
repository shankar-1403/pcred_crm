import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { ROLES, ROLE_LABELS } from '../constants'
import { IconLinkFilled,IconUserFilled,IconMenu2,IconCheckFilled } from '@tabler/icons-react'
import ThemeToggle from './ThemeToggle'

const linkClass = (theme) => ({ isActive }) =>
  [
    'rounded-lg px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap',
    isActive
      ? 'bg-blue-600 text-white'
      : theme === 'dark'
        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-950',
  ].join(' ')

export default function Layout() {
  const { profile, logout } = useAuth()
  const [textCopied, setTextCopied] = useState("");
  const { theme } = useTheme()
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
                src={theme === 'dark' ? '/pcred-logo.png': '/logo.webp'}
                alt="Pcred logo"
                className={`${theme === "dark" ? "h-9" : "h-9"} object-contain`}
              />
            </NavLink>
            <div className="lg:hidden items-center gap-2 flex">
              <span
                className={[
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  theme === 'dark'
                    ? 'bg-slate-800 text-blue-300'
                    : 'bg-blue-100 text-blue-800',
                ].join(' ')}
              >
                {ROLE_LABELS[role] ?? role}
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={[
                  'rounded-lg border px-3 py-1.5 transition-colors',
                  theme === 'dark'
                    ? 'border-slate-600 hover:bg-slate-800'
                    : 'border-slate-300 bg-white hover:bg-slate-100',
                ].join(' ')}
                aria-label="Toggle navigation menu"
                aria-expanded={menuOpen}
              >
                <IconMenu2
                  size={20}
                  stroke={2}
                  color={theme === 'dark' ? '#f8fafc' : '#1e3a8a'}
                />
              </button>
            </div>
            <div className="hidden lg:flex items-center justify-between gap-4 w-full">
              <nav className="flex flex-wrap gap-1">
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/users" className={linkClass(theme)} onClick={closeMenu}>
                    User management
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/products" className={linkClass(theme)} onClick={closeMenu}>
                    Product master
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/statuses" className={linkClass(theme)} onClick={closeMenu}>
                    Status master
                  </NavLink>
                )}
                {role === ROLES.MANAGEMENT && (
                  <NavLink to="/management" className={linkClass(theme)} onClick={closeMenu}>
                    Loan leads
                  </NavLink>
                )}
                {role === ROLES.SALES && (
                  <NavLink to="/sales" className={linkClass(theme)} onClick={closeMenu}>
                    Loan leads
                  </NavLink>
                )}
                {role === ROLES.PROCESS && (
                  <NavLink to="/process" className={linkClass(theme)} onClick={closeMenu}>
                    Loan leads
                  </NavLink>
                )}
                {role === ROLES.EMPLOYEES && (
                  <NavLink to="/employee-dashbaord" className={linkClass(theme)} onClick={closeMenu}>
                    Loan leads
                  </NavLink>
                )}
                {role === ROLES.ELITE_AMBASSADOR && (
                  <NavLink to="/elite-ambassador" className={linkClass(theme)} onClick={closeMenu}>
                    Loan leads
                  </NavLink>
                )}
                {role === ROLES.AMBASSADOR && (
                  <NavLink to="/ambassador" className={linkClass(theme)} onClick={closeMenu}>
                    Loan leads
                  </NavLink>
                )}
                {role === ROLES.ELITE_AMBASSADOR && (
                  <NavLink to="/elite-ambassador-other-leads" className={linkClass(theme)} onClick={closeMenu}>
                    Other leads
                  </NavLink>
                )}
                {role === ROLES.AMBASSADOR && (
                  <NavLink to="/ambassador-other-leads" className={linkClass(theme)} onClick={closeMenu}>
                    Other leads
                  </NavLink>
                )}
                {[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                  <NavLink to="/other-leads" className={linkClass(theme)} onClick={closeMenu}>
                    Other leads
                  </NavLink>
                )}
                {[ROLES.SALES,ROLES.PROCESS,ROLES.MANAGEMENT,ROLES.ELITE_AMBASSADOR].includes(role) && (
                  <NavLink to="/ambassadors-list" className={linkClass(theme)} onClick={closeMenu}>
                    Ambassadors List
                  </NavLink>
                )}
                {[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES,ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                  <NavLink to="/certificate" className={linkClass(theme)} onClick={closeMenu}>
                    Certificate
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/category" className={linkClass(theme)} onClick={closeMenu}>
                    Category
                  </NavLink>
                )}
                {role === ROLES.ADMIN && (
                  <NavLink to="/admin/services" className={linkClass(theme)} onClick={closeMenu}>
                    Services
                  </NavLink>
                )}
                {[ROLES.ADMIN].includes(role) && (
                  <NavLink to="/creative" className={linkClass(theme)} onClick={closeMenu}>
                    Creative
                  </NavLink>
                )}
                {[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES,ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                  <NavLink to="/visiting-card" className={linkClass(theme)} onClick={closeMenu}>
                    Visiting Card
                  </NavLink>
                )}
                {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR,ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                  <NavLink to="/sales-material" className={linkClass(theme)} onClick={closeMenu}>
                    Sales Material
                  </NavLink>
                )}
                {(role === ROLES.ADMIN || profile?.uid === "thy1xXKWoQXShRv3g31vuE180Uh1") && (
                  <NavLink to="/admin/elite-ambassador-master" className={linkClass(theme)} onClick={closeMenu}>
                    Elite ambassador master
                  </NavLink>
                )}
                {(role === ROLES.ADMIN || profile?.uid === "thy1xXKWoQXShRv3g31vuE180Uh1") && (
                  <NavLink to="/admin/ambassador-master" className={linkClass(theme)} onClick={closeMenu}>
                    Ambassador master
                  </NavLink>
                )}
              </nav>
              <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
                <ThemeToggle />
                
                {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR,ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                  <button onClick={handleCopy} className='cursor-pointer flex text-nowrap items-center gap-1 text-sm bg-slate-800 text-blue-300 py-1 px-3 hover:underline rounded-2xl' title='ECB MSME Link'>
                    ECB MSME Link
                    {textCopied ?
                      <IconCheckFilled size={14} color={theme === 'dark' ?'#ffffff': "#000000"}/>
                      :
                      <IconLinkFilled size={14} color={theme === 'dark' ?'#ffffff': "#000000"}/>
                    }
                  </button>
                )}
                <div className="relative inline-block">
                  <button type="button" onClick={() => setProfileOpen((v) => !v)} className='cursor-pointer rounded-full border border-blue-600 p-2 text-sm font-medium hidden lg:block transition-colors'>
                    <IconUserFilled size={20} className='white'/>
                  </button>
                  {profileOpen && (
                    <>
                      <div className="absolute top-14 w-70 right-0.5 z-40">
                        <div className="relative flex flex-col space-y-1 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl">
                          <span className="w-full text-center text-lg font-bold">
                            {profile?.displayName ?? profile?.email}
                          </span>
                          <span className="w-full text-center">
                            {ROLE_LABELS[role] ?? role}
                          </span>
                          <button type="button" onClick={() => {closeMenu(),logout()}} className="rounded-lg border border-red-500/50 px-2 py-1 text-white bg-red-500/20 cursor-pointer transition-colors hover:border-slate-500 hover:bg-slate-800">
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
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 px-3 lg:hidden">
          <div className="mx-auto max-w-350 space-y-3 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl">
            <nav className="grid gap-1">
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/users" className={linkClass(theme)} onClick={closeMenu}>
                  User management
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/products" className={linkClass(theme)} onClick={closeMenu}>
                  Product master
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/statuses" className={linkClass(theme)} onClick={closeMenu}>
                  Status master
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/category" className={linkClass(theme)} onClick={closeMenu}>
                  Category
                </NavLink>
              )}
              {role === ROLES.MANAGEMENT && (
                <NavLink to="/management" className={linkClass(theme)} onClick={closeMenu}>
                  Loan leads
                </NavLink>
              )}
              {role === ROLES.SALES && (
                <NavLink to="/sales" className={linkClass(theme)} onClick={closeMenu}>
                  Loan Leads
                </NavLink>
              )}
              {role === ROLES.PROCESS && (
                <NavLink to="/process" className={linkClass(theme)} onClick={closeMenu}>
                  Loan Leads
                </NavLink>
              )}
              {role === ROLES.EMPLOYEES && (
                <NavLink to="/employee-dashboard" className={linkClass(theme)} onClick={closeMenu}>
                  Loan Leads
                </NavLink>
              )}
              {role === ROLES.ELITE_AMBASSADOR && (
                <NavLink
                  to="/elite-ambassador"
                  className={linkClass(theme)}
                  onClick={closeMenu}
                >
                  Elite ambassador dashboard
                </NavLink>
              )}
              {role === ROLES.AMBASSADOR && (
                <NavLink to="/ambassador" className={linkClass(theme)} onClick={closeMenu}>
                  Ambassador dashboard
                </NavLink>
              )}
               {[ROLES.ELITE_AMBASSADOR].includes(role) && (
                <NavLink to="/elite-ambassador-other-leads" className={linkClass(theme)} onClick={closeMenu}>
                  Other leads
                </NavLink>
              )}
              {[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                <NavLink to="/other-leads" className={linkClass(theme)} onClick={closeMenu}>
                  Other leads
                </NavLink>
              )}
              {[ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/ambassador-other-leads" className={linkClass(theme)} onClick={closeMenu}>
                  Other leads
                </NavLink>
              )}
              {[ROLES.SALES,ROLES.PROCESS,ROLES.MANAGEMENT,ROLES.ELITE_AMBASSADOR].includes(role) && (
                <NavLink to="/ambassadors-list" className={linkClass(theme)} onClick={closeMenu}>
                  Ambassadors List
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/certificate" className={linkClass(theme)} onClick={closeMenu}>
                  Certificate
                </NavLink>
              )}
              {role === ROLES.ADMIN && (
                <NavLink to="/admin/services" className={linkClass(theme)} onClick={closeMenu}>
                  Services
                </NavLink>
              )}
              {[ROLES.ADMIN].includes(role) && (
                <NavLink to="/creative" className={linkClass(theme)} onClick={closeMenu}>
                  Creative
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR,ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                <NavLink to="/sales-material" className={linkClass(theme)} onClick={closeMenu}>
                  Sales Material
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/visiting-card" className={linkClass(theme)} onClick={closeMenu}>
                  Visiting Card
                </NavLink>
              )}
              {[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES,ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR].includes(role) && (
                <NavLink to="/visiting-card" className={linkClass(theme)} onClick={closeMenu}>
                  Visiting Card
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR,ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                <NavLink to="/sales-material" className={linkClass(theme)} onClick={closeMenu}>
                  Sales Material
                </NavLink>
              )}
              {(role === ROLES.ADMIN || profile?.uid === "thy1xXKWoQXShRv3g31vuE180Uh1") && (
                <NavLink to="/admin/elite-ambassador-master" className={linkClass(theme)} onClick={closeMenu}>
                  Elite ambassador master
                </NavLink>
              )}
              {(role === ROLES.ADMIN || profile?.uid === "thy1xXKWoQXShRv3g31vuE180Uh1") && (
                <NavLink to="/admin/ambassador-master" className={linkClass(theme)} onClick={closeMenu}>
                  Ambassador master
                </NavLink>
              )}
              {[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR,ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES].includes(role) && (
                <button onClick={handleCopy} className='cursor-pointer flex justify-center items-center gap-1 text-sm text-center bg-slate-800 text-blue-300 py-2 px-3 hover:underline rounded-2xl' title='ECB MSME Link'>
                  ECB MSME Link
                  {textCopied ?
                    <IconCheckFilled size={14} color={theme === 'dark' ?'#ffffff': "#000000"}/>
                    :
                    <IconLinkFilled size={14} color={theme === 'dark' ?'#ffffff': "#000000"}/>
                  }
                </button>
              )}
            </nav>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <span className="text-xs text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
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
      <main className="mx-auto min-w-0 max-w-350 px-3 pb-5 pt-24 sm:px-4 sm:pb-8 sm:pt-28">
        <Outlet />
      </main>
    </div>
  )
}
