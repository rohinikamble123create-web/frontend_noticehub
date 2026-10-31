import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
import { useAuth } from '@/core/auth'
import type { NoticeView, DoubtView } from '../types'
import {
  getNotice,
  updateNotice,
  deleteNotice,
  downloadAttachment,
  listDoubts,
  createDoubt,
} from '../api/noticesApi'
import { StatusBadge } from '../components/StatusBadge'
import { DoubtItem } from '../components/DoubtItem'
import styles from './NoticeDetailScreen.module.css'

export function NoticeDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── Permission helpers ─────────────────────────────────────────────────────
  const isAdmin = user?.role === 'admin'
  const isOfficeOrAdmin = isAdmin || user?.role === 'office_staff'

  // ── Notice state ───────────────────────────────────────────────────────────
  const [notice, setNotice] = useState<NoticeView | null>(null)
  const [noticeError, setNoticeError] = useState<string>()
  const [noticeLoading, setNoticeLoading] = useState(true)

  // ── Doubts state ───────────────────────────────────────────────────────────
  const [doubts, setDoubts] = useState<DoubtView[] | null>(null)
  const [doubtsError, setDoubtsError] = useState<string>()
  const [question, setQuestion] = useState('')
  const [questionError, setQuestionError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ── Attachment state ───────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string>()

  // ── Action state ───────────────────────────────────────────────────────────
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string>()

  // ── Load notice ────────────────────────────────────────────────────────────
  const loadNotice = useCallback(async () => {
    if (!id) return
    setNoticeLoading(true)
    setNoticeError(undefined)
    try {
      const data = await getNotice(id)
      setNotice(data)
    } catch (err) {
      setNoticeError(err instanceof Error ? err.message : 'Could not load notice.')
    } finally {
      setNoticeLoading(false)
    }
  }, [id])

  // ── Load doubts ────────────────────────────────────────────────────────────
  const loadDoubts = useCallback(async () => {
    if (!id) return
    setDoubtsError(undefined)
    try {
      const data = await listDoubts(id)
      setDoubts(data.items)
    } catch (err) {
      setDoubtsError(err instanceof Error ? err.message : 'Could not load questions.')
    }
  }, [id])

  useEffect(() => {
    loadNotice()
    loadDoubts()
  }, [loadNotice, loadDoubts])

  // ── Derived permissions (after notice loaded) ──────────────────────────────
  const isNoticeOwner = notice ? (user?.id === notice.created_by || isAdmin) : false
  const canEdit = isNoticeOwner
  const canDelete = isNoticeOwner
  const canPin = isNoticeOwner
  const canArchive = isOfficeOrAdmin
  const canAnswerDoubts = notice
    ? (isAdmin || user?.id === notice.created_by)
    : false

  // ── Action handlers ────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!notice) return
    if (!window.confirm(`Delete "${notice.title}"? This cannot be undone.`)) return
    setActionBusy(true)
    setActionError(undefined)
    try {
      await deleteNotice(notice.notice_id)
      navigate('/tracks/notice-hub', { replace: true })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete notice.')
      setActionBusy(false)
    }
  }

  async function handleTogglePin() {
    if (!notice) return
    setActionBusy(true)
    setActionError(undefined)
    try {
      const updated = await updateNotice(notice.notice_id, { pinned: !notice.pinned })
      setNotice(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update pin.')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleToggleArchive() {
    if (!notice) return
    const newStatus = notice.status === 'archived' ? 'active' : 'archived'
    if (
      !window.confirm(
        newStatus === 'archived'
          ? `Archive "${notice.title}"?`
          : `Restore "${notice.title}" to active?`,
      )
    )
      return
    setActionBusy(true)
    setActionError(undefined)
    try {
      const updated = await updateNotice(notice.notice_id, { status: newStatus })
      setNotice(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update status.')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleDownload() {
    if (!notice) return
    setDownloading(true)
    setDownloadError(undefined)
    try {
      await downloadAttachment(notice.notice_id)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Could not download attachment.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleSubmitDoubt(e: FormEvent) {
    e.preventDefault()
    const trimmed = question.trim()
    if (trimmed.length < 5) {
      setQuestionError('Question must be at least 5 characters.')
      return
    }
    if (trimmed.length > 1000) {
      setQuestionError('Question must be at most 1000 characters.')
      return
    }
    setQuestionError(undefined)
    setSubmitting(true)
    setSubmitSuccess(false)
    try {
      await createDoubt(id!, trimmed)
      setQuestion('')
      setSubmitSuccess(true)
      loadDoubts()
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'Could not submit question.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (noticeLoading) {
    return <Spinner label="Loading notice…" />
  }

  if (noticeError) {
    return (
      <Stack gap={3}>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Alert tone="danger">{noticeError}</Alert>
      </Stack>
    )
  }

  if (!notice) return null

  const publishedDate = new Date(notice.publish_at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Stack gap={5} data-testid="notice-hub-detail">
      {/* Back + action bar */}
      <div className={styles.actions}>
        <Button
          variant="ghost"
          onClick={() => navigate('/tracks/notice-hub')}
          data-testid="notice-hub-back-btn"
        >
          ← Back
        </Button>

        <Stack direction="row" gap={2} wrap>
          {canPin && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionBusy}
              onClick={handleTogglePin}
              data-testid="notice-hub-pin-btn"
            >
              {notice.pinned ? 'Unpin' : '📌 Pin'}
            </Button>
          )}

          {canArchive && notice.status !== 'scheduled' && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionBusy}
              onClick={handleToggleArchive}
              data-testid="notice-hub-archive-btn"
            >
              {notice.status === 'archived' ? '📤 Restore' : '📦 Archive'}
            </Button>
          )}

          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/tracks/notice-hub/edit/${notice.notice_id}`)}
              data-testid="notice-hub-edit-btn"
            >
              ✏️ Edit
            </Button>
          )}

          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              loading={actionBusy}
              onClick={handleDelete}
              data-testid="notice-hub-delete-btn"
            >
              🗑 Delete
            </Button>
          )}
        </Stack>
      </div>

      {actionError && <Alert tone="danger">{actionError}</Alert>}

      {/* Notice body */}
      <Card>
        <Stack gap={4}>
          <Stack gap={2}>
            <Stack direction="row" gap={2} align="flex-start" wrap>
              <Text as="h1" size="2xl" weight="bold" style={{ flex: 1 }}>
                {notice.title}
              </Text>
              <StatusBadge status={notice.status} pinned={notice.pinned} />
            </Stack>

            <div className={styles.meta}>
              <Text size="sm" tone="textMuted">
                By <strong>{notice.created_by_name}</strong> ({notice.created_by_role})
              </Text>
              <Text size="sm" tone="textMuted">
                {publishedDate}
              </Text>
            </div>
          </Stack>

          <hr className={styles.divider} />

          <Text className={styles.noticeBody}>{notice.body}</Text>

          {/* Attachment */}
          {notice.attachment && (
            <Stack gap={2}>
              <hr className={styles.divider} />
              <Stack direction="row" align="center" gap={3} wrap>
                <Text size="sm" tone="textMuted">
                  📎 {notice.attachment.filename} ({(notice.attachment.size_bytes / 1024).toFixed(1)} KB)
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={downloading}
                  onClick={handleDownload}
                  data-testid="notice-hub-download-btn"
                >
                  Download
                </Button>
              </Stack>
              {downloadError && (
                <Alert tone="danger">{downloadError}</Alert>
              )}
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Doubts / Q&A section */}
      <Stack gap={4}>
        <div className={styles.doubtsHeader}>
          <Text as="h2" size="xl" weight="bold">
            Questions &amp; Answers
          </Text>
          {canAnswerDoubts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/tracks/notice-hub/manage-doubts/${notice.notice_id}`)
              }
              data-testid="notice-hub-manage-doubts-btn"
            >
              Manage doubts →
            </Button>
          )}
        </div>

        {/* Ask a question form (active notices only) */}
        {notice.status === 'active' && (
          <Card>
            <form onSubmit={handleSubmitDoubt} aria-label="Ask a question">
              <Stack gap={3}>
                <Text weight="medium">Ask a question about this notice</Text>
                <textarea
                  className={styles.textarea}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question… (5–1000 characters)"
                  rows={3}
                  maxLength={1000}
                  aria-label="Your question"
                  data-testid="notice-hub-question-input"
                />
                <Text size="xs" tone="textMuted" className={styles.charCount}>
                  {question.trim().length}/1000
                </Text>
                {questionError && (
                  <Alert tone="danger">{questionError}</Alert>
                )}
                {submitSuccess && (
                  <Alert tone="success">Your question was submitted!</Alert>
                )}
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={question.trim().length < 5}
                  data-testid="notice-hub-submit-question-btn"
                >
                  Submit question
                </Button>
              </Stack>
            </form>
          </Card>
        )}

        {/* Doubts list */}
        {doubts === null && !doubtsError && <Spinner label="Loading questions…" />}
        {doubtsError && <Alert tone="danger">{doubtsError}</Alert>}
        {doubts !== null && doubts.length === 0 && (
          <Text tone="textMuted">No questions yet.</Text>
        )}
        {doubts !== null && doubts.length > 0 && (
          <Stack gap={3} as="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {doubts.map((doubt) => (
              <li key={doubt.doubt_id}>
                <DoubtItem
                  doubt={doubt}
                  noticeCreatedBy={notice.created_by}
                  onChanged={loadDoubts}
                />
              </li>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
