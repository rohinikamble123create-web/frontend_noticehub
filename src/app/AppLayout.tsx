import { useState, useTransition } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { tracks } from '@/core/tracks/registry'
import { Button, Text, ThemeToggle } from '@/ui'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [, startTransition] = useTransition()

  async function onSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const closeDrawer = () => setDrawerOpen(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')

  // Dynamic breadcrumb label from current route
  function getBreadcrumb(): string {
    const p = location.pathname
    if (p === '/') return 'Overview'
    if (p === '/admin') return 'Admin Dashboard'
    if (p.startsWith('/tracks/notice-hub')) return 'Campus Notice Hub'
    if (p.startsWith('/tracks/example')) return 'Example Notes'
    return 'CampusOS'
  }

  return (
    <div className={styles.shell}>
      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Enterprise Deep Navy Sidebar ── */}
      <aside
        className={[styles.sidebar, drawerOpen && styles.sidebarOpen].filter(Boolean).join(' ')}
      >
        <div className={styles.brandWrap}>
          <Link to="/" className={styles.brand} onClick={closeDrawer}>
            <span>🎓</span>
            <span>CampusOS</span>
          </Link>
          {user && (
            <span className={styles.roleChip}>
              {user.role === 'office_staff' ? 'Staff' : user.role}
            </span>
          )}
        </div>

        {/* Tracks Navigation (aria-label="Tracks" required for test compatibility) */}
        <nav aria-label="Tracks" className={styles.nav}>
          <div className={styles.navSectionTitle}>Main Workspace</div>

          <NavLink
            to="/"
            end
            className={navClass}
            onClick={() => startTransition(closeDrawer)}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={navClass}
              data-testid="nav-admin"
              onClick={() => startTransition(closeDrawer)}
            >
              <span>🛡️</span>
              <span>Admin Dashboard</span>
            </NavLink>
          )}
          {user?.role === 'faculty' && (
            <NavLink
              to="/faculty"
              className={navClass}
              data-testid="nav-faculty"
              onClick={() => startTransition(closeDrawer)}
            >
              <span>👩‍🏫</span>
              <span>Faculty Dashboard</span>
            </NavLink>
          )}
          {user?.role === 'office_staff' && (
            <NavLink
              to="/staff"
              className={navClass}
              data-testid="nav-staff"
              onClick={() => startTransition(closeDrawer)}
            >
              <span>🏢</span>
              <span>Staff Dashboard</span>
            </NavLink>
          )}
          {user?.role === 'student' && (
            <NavLink
              to="/student"
              className={navClass}
              data-testid="nav-student"
              onClick={() => startTransition(closeDrawer)}
            >
              <span>🎓</span>
              <span>Student Dashboard</span>
            </NavLink>
          )}
          <div className={styles.navSectionTitle}>Campus Modules</div>

          {tracks.map((track) => (
            <NavLink
              key={track.id}
              to={`/tracks/${track.id}`}
              className={navClass}
              onClick={() => startTransition(closeDrawer)}
            >
              <span>{track.icon ?? '📌'}</span>
              <span>{track.navLabel ?? track.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer: Current User Profile Card */}
        {user && (
          <div className={styles.sidebarFooter}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>
                {user.role === 'office_staff' ? 'Office Staff' : user.role}
              </span>
            </div>
            <ThemeToggle />
          </div>
        )}
      </aside>

      {/* ── Main Canvas & Header ── */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerStart}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? '✕' : '☰'}
            </button>

            <div className={styles.breadcrumb}>
              <span>CampusOS</span>
              <span>/</span>
              <span className={styles.breadcrumbCurrent}>{getBreadcrumb()}</span>
            </div>
          </div>

          <div className={styles.actions}>
            {user && (
              <div className={styles.userBadge}>
                <Text as="span" size="sm" weight="medium">
                  {user.name}
                </Text>
                <Text as="span" size="xs" tone="textMuted">
                  ({user.role})
                </Text>
              </div>
            )}
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={onSignOut}
              data-testid="sign-out"
            >
              Sign out
            </Button>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
