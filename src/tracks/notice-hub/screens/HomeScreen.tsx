import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { useAuth } from '@/core/auth'
import type { NoticeView, NoticeStatus } from '../types'
import { listNotices } from '../api/noticesApi'
import { NoticeCard } from '../components/NoticeCard'
import styles from './HomeScreen.module.css'

type TabId = 'active' | 'pinned' | 'scheduled' | 'archived' | 'mine'

interface Tab {
  id: TabId
  label: string
  /** Roles that can see this tab. Empty = everyone. */
  roles?: string[]
}

const ALL_TABS: Tab[] = [
  { id: 'active',    label: 'All Notices' },
  { id: 'pinned',    label: '📌 Pinned' },
  { id: 'scheduled', label: '🕐 Scheduled', roles: ['admin', 'faculty', 'office_staff'] },
  { id: 'archived',  label: '📦 Archived',  roles: ['admin', 'office_staff'] },
  { id: 'mine',      label: 'My Notices',   roles: ['admin', 'faculty', 'office_staff'] },
]

export function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isPublisher =
    user?.role === 'admin' ||
    user?.role === 'faculty' ||
    user?.role === 'office_staff'

  const visibleTabs = ALL_TABS.filter(
    (t) => !t.roles || t.roles.includes(user?.role ?? ''),
  )

  const [activeTab, setActiveTab] = useState<TabId>('active')
  const [notices, setNotices] = useState<NoticeView[] | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string>()

  // Build API params from the selected tab
  function tabToParams(tab: TabId): Parameters<typeof listNotices>[0] {
    switch (tab) {
      case 'pinned':    return { status: 'active' as NoticeStatus, pinned: true }
      case 'scheduled': return { status: 'scheduled' as NoticeStatus }
      case 'archived':  return { status: 'archived' as NoticeStatus }
      case 'mine':      return { mine: true }
      default:          return { status: 'active' as NoticeStatus }
    }
  }

  const loadNotices = useCallback(async (tab: TabId) => {
    setNotices(null)
    setNextCursor(null)
    setError(undefined)
    try {
      const result = await listNotices(tabToParams(tab))
      setNotices(result.items)
      setNextCursor(result.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notices.')
    }
  }, [])

  useEffect(() => {
    loadNotices(activeTab)
  }, [activeTab, loadNotices])

  async function handleLoadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const result = await listNotices({ ...tabToParams(activeTab), cursor: nextCursor })
      setNotices((prev) => [...(prev ?? []), ...result.items])
      setNextCursor(result.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more notices.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <Stack gap={5}>
      {/* Header */}
      <div className={styles.header}>
        <Stack gap={1}>
          <Text as="h1" size="2xl" weight="bold" data-testid="notice-hub-heading">
            📋 Campus Notice Hub
          </Text>
          <Text tone="textMuted">
            Stay updated with the latest campus announcements.
          </Text>
        </Stack>

        {isPublisher && (
          <Button
            onClick={() => navigate('/tracks/notice-hub/create')}
            data-testid="notice-hub-create-btn"
          >
            + Create Notice
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs} role="tablist" aria-label="Notice filters">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`notice-hub-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {notices === null && !error && (
        <Spinner label="Loading notices…" />
      )}

      {error && (
        <Alert tone="danger" data-testid="notice-hub-error">
          {error}
        </Alert>
      )}

      {notices !== null && notices.length === 0 && (
        <div className={styles.empty}>
          <Text tone="textMuted">
            {activeTab === 'pinned'    && 'No pinned notices.'}
            {activeTab === 'scheduled' && 'No scheduled notices.'}
            {activeTab === 'archived'  && 'No archived notices.'}
            {activeTab === 'mine'      && "You haven't posted any notices yet."}
            {activeTab === 'active'    && 'No notices available.'}
          </Text>
        </div>
      )}

      {notices !== null && notices.length > 0 && (
        <Stack gap={3}>
          <div className={styles.grid}>
            {notices.map((notice) => (
              <NoticeCard
                key={notice.notice_id}
                notice={notice}
                onClick={() => navigate(`/tracks/notice-hub/${notice.notice_id}`)}
              />
            ))}
          </div>

          {nextCursor && (
            <Button
              variant="secondary"
              loading={loadingMore}
              onClick={handleLoadMore}
              data-testid="notice-hub-load-more-btn"
            >
              Load more
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  )
}
