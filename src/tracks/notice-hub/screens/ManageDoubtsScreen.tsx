import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
import { useAuth } from '@/core/auth'
import type { DoubtView, NoticeView } from '../types'
import { getNotice, listDoubts } from '../api/noticesApi'
import { DoubtItem } from '../components/DoubtItem'

type Filter = 'all' | 'unanswered'

export function ManageDoubtsScreen() {
  const { id: noticeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'

  // ── Notice ─────────────────────────────────────────────────────────────────
  const [notice, setNotice] = useState<NoticeView | null>(null)
  const [noticeError, setNoticeError] = useState<string>()

  // ── Doubts ─────────────────────────────────────────────────────────────────
  const [doubts, setDoubts] = useState<DoubtView[] | null>(null)
  const [doubtsError, setDoubtsError] = useState<string>()
  const [filter, setFilter] = useState<Filter>('all')

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadNotice = useCallback(async () => {
    if (!noticeId) return
    try {
      setNotice(await getNotice(noticeId))
    } catch (err) {
      setNoticeError(err instanceof Error ? err.message : 'Could not load notice.')
    }
  }, [noticeId])

  const loadDoubts = useCallback(async () => {
    if (!noticeId) return
    setDoubts(null)
    setDoubtsError(undefined)
    try {
      const params = filter === 'unanswered' ? { answered: false } : undefined
      const result = await listDoubts(noticeId, params)
      setDoubts(result.items)
    } catch (err) {
      setDoubtsError(err instanceof Error ? err.message : 'Could not load questions.')
    }
  }, [noticeId, filter])

  useEffect(() => { loadNotice() }, [loadNotice])
  useEffect(() => { loadDoubts() }, [loadDoubts])

  // ── Permission check ───────────────────────────────────────────────────────
  const canManage = notice
    ? isAdmin || user?.id === notice.created_by
    : false

  if (notice && !canManage) {
    return (
      <Alert tone="danger" data-testid="notice-hub-access-denied">
        🚫 Only the notice publisher or an admin can manage doubts.
      </Alert>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Stack gap={5} data-testid="notice-hub-manage-doubts">
      {/* Header */}
      <Stack gap={2}>
        <Button
          variant="ghost"
          onClick={() => navigate(`/tracks/notice-hub/${noticeId}`)}
          data-testid="notice-hub-back-btn"
        >
          ← Back to notice
        </Button>

        <Text as="h1" size="2xl" weight="bold">
          ❓ Manage Doubts
        </Text>

        {notice && (
          <Card>
            <Text weight="medium">{notice.title}</Text>
            <Text size="sm" tone="textMuted">
              {notice.status === 'active' ? 'Active' : notice.status} · {notice.created_by_name}
            </Text>
          </Card>
        )}

        {noticeError && <Alert tone="danger">{noticeError}</Alert>}
      </Stack>

      {/* Filter tabs */}
      <Stack direction="row" gap={2}>
        {(['all', 'unanswered'] as Filter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f)}
            data-testid={`notice-hub-filter-${f}`}
          >
            {f === 'all' ? 'All questions' : 'Unanswered only'}
          </Button>
        ))}
      </Stack>

      {/* Doubts list */}
      {doubts === null && !doubtsError && <Spinner label="Loading questions…" />}

      {doubtsError && <Alert tone="danger">{doubtsError}</Alert>}

      {doubts !== null && doubts.length === 0 && (
        <Text tone="textMuted">
          {filter === 'unanswered'
            ? 'All questions have been answered! 🎉'
            : 'No questions yet.'}
        </Text>
      )}

      {doubts !== null && doubts.length > 0 && (
        <Stack gap={3} as="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {doubts.map((doubt) => (
            <li key={doubt.doubt_id}>
              <DoubtItem
                doubt={doubt}
                noticeCreatedBy={notice?.created_by ?? ''}
                onChanged={loadDoubts}
              />
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
