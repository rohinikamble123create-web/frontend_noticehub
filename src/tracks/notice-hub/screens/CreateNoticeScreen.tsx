import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert, Button, Card, Spinner, Stack, Text, TextField } from '@/ui'
import { useAuth } from '@/core/auth'
import type { NoticeView } from '../types'
import { getNotice, createNotice, updateNotice } from '../api/noticesApi'
import styles from './CreateNoticeScreen.module.css'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export function CreateNoticeScreen() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id?: string }>()
  const isEditMode = Boolean(editId)
  const { user } = useAuth()

  // Gate: only publishers can access this screen
  const isPublisher =
    user?.role === 'admin' ||
    user?.role === 'faculty' ||
    user?.role === 'office_staff'

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [publishAt, setPublishAt] = useState('') // datetime-local string
  const [file, setFile] = useState<File | undefined>()
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [existingAttachment, setExistingAttachment] = useState<NoticeView['attachment']>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(isEditMode) // true while prefilling
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string>()

  // ── Prefill for edit mode ──────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return
    ;(async () => {
      try {
        const notice = await getNotice(editId)
        setTitle(notice.title)
        setBody(notice.body)
        setPinned(notice.pinned)
        setExistingAttachment(notice.attachment)
        // Only prefill publish_at if notice is still scheduled
        if (notice.status === 'scheduled') {
          // Convert ISO datetime to datetime-local format (strip seconds + tz)
          const dt = new Date(notice.publish_at)
          const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
          setPublishAt(local)
        }
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : 'Could not load notice.')
      } finally {
        setLoading(false)
      }
    })()
  }, [editId])

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required.'
    else if (title.trim().length < 3) errs.title = 'Title must be at least 3 characters.'
    else if (title.trim().length > 150) errs.title = 'Title must be at most 150 characters.'

    if (!body.trim()) errs.body = 'Body is required.'
    else if (body.trim().length > 5000) errs.body = 'Body must be at most 5000 characters.'

    if (publishAt) {
      const selected = new Date(publishAt)
      if (selected <= new Date()) errs.publishAt = 'Scheduled time must be in the future.'
    }

    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.file = 'Only PDF, JPEG and PNG files are allowed.'
      } else if (file.size > MAX_BYTES) {
        errs.file = 'File must be smaller than 10 MB.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── File picker ────────────────────────────────────────────────────────────
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    setFile(picked)
    setErrors((prev) => ({ ...prev, file: '' }))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setGlobalError(undefined)
    setSuccess(false)

    const publishAtISO = publishAt
      ? new Date(publishAt).toISOString()
      : undefined

    try {
      if (isEditMode && editId) {
        await updateNotice(editId, {
          title: title.trim(),
          body: body.trim(),
          pinned,
          publish_at: publishAtISO,
          attachment: file,
          remove_attachment: removeAttachment,
        })
        setSuccess(true)
        setTimeout(() => navigate(`/tracks/notice-hub/${editId}`), 800)
      } else {
        const created = await createNotice({
          title: title.trim(),
          body: body.trim(),
          pinned,
          publish_at: publishAtISO,
          attachment: file,
        })
        setSuccess(true)
        setTimeout(() => navigate(`/tracks/notice-hub/${created.notice_id}`), 800)
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Could not save notice.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!isPublisher) {
    return (
      <Alert tone="danger" data-testid="notice-hub-access-denied">
        🚫 You do not have permission to create notices.
      </Alert>
    )
  }

  if (loading) {
    return <Spinner label="Loading notice…" />
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Stack gap={5}>
      <Stack gap={1}>
        <Text as="h1" size="2xl" weight="bold" data-testid="notice-hub-form-heading">
          {isEditMode ? '✏️ Edit Notice' : '✏️ Create New Notice'}
        </Text>
        <Text tone="textMuted">
          {isEditMode
            ? 'Update the notice details below.'
            : 'Fill in the details below to publish or schedule a notice.'}
        </Text>
      </Stack>

      <Card>
        <form onSubmit={handleSubmit} noValidate aria-label="Notice form" className={styles.form}>

          {/* Title */}
          <div className={styles.fieldGroup}>
            <TextField
              label="Notice Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fee payment deadline extended"
              maxLength={150}
              error={errors.title}
              data-testid="notice-hub-title-input"
              required
            />
            <Text size="xs" tone="textMuted">
              {title.length}/150 characters
            </Text>
          </div>

          {/* Body */}
          <div className={styles.fieldGroup}>
            <label htmlFor="notice-body" className={styles.label}>
              Notice Body <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="notice-body"
              className={`${styles.textarea} ${errors.body ? styles.error : ''}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full notice content here…"
              rows={8}
              maxLength={5000}
              required
              aria-describedby={errors.body ? 'body-error' : undefined}
              data-testid="notice-hub-body-input"
            />
            {errors.body && (
              <Text id="body-error" size="sm" className={styles.errorText}>
                {errors.body}
              </Text>
            )}
            <Text size="xs" tone="textMuted">
              {body.length}/5000 characters
            </Text>
          </div>

          {/* Pin */}
          <div className={styles.fieldGroup}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                data-testid="notice-hub-pinned-checkbox"
              />
              <Text as="span" size="sm" weight="medium">
                Pin this notice (appears at the top of the list)
              </Text>
            </label>
          </div>

          {/* Schedule */}
          <div className={styles.fieldGroup}>
            <label htmlFor="notice-publish-at" className={styles.label}>
              Schedule Publication (optional)
            </label>
            <input
              id="notice-publish-at"
              type="datetime-local"
              className={styles.textarea}
              style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              data-testid="notice-hub-schedule-input"
            />
            {errors.publishAt && (
              <Text size="sm" className={styles.errorText}>{errors.publishAt}</Text>
            )}
            <Text size="xs" tone="textMuted">
              Leave empty to publish immediately. India time is used by default.
            </Text>
          </div>

          {/* Attachment */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Attachment (optional — PDF, JPEG or PNG, max 10 MB)
            </label>

            {/* Existing attachment in edit mode */}
            {isEditMode && existingAttachment && !removeAttachment && (
              <div className={styles.attachmentInfo}>
                <Text size="sm">
                  📎 Current: <strong>{existingAttachment.filename}</strong>{' '}
                  ({(existingAttachment.size_bytes / 1024).toFixed(1)} KB)
                </Text>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setRemoveAttachment(true)}
                  data-testid="notice-hub-remove-attachment-btn"
                >
                  Remove
                </Button>
              </div>
            )}

            {isEditMode && removeAttachment && (
              <Alert tone="danger">
                Current attachment will be deleted on save.{' '}
                <button
                  type="button"
                  onClick={() => setRemoveAttachment(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Undo
                </button>
              </Alert>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className={styles.fileInput}
              onChange={handleFileChange}
              data-testid="notice-hub-file-input"
            />
            {file && (
              <Text size="sm" tone="textMuted">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Text>
            )}
            {errors.file && (
              <Text size="sm" className={styles.errorText}>{errors.file}</Text>
            )}
          </div>

          {/* Global error / success */}
          {globalError && <Alert tone="danger">{globalError}</Alert>}
          {success && (
            <Alert tone="success">
              {isEditMode ? 'Notice updated!' : 'Notice created!'} Redirecting…
            </Alert>
          )}

          {/* Form actions */}
          <div className={styles.formActions}>
            <Button
              type="submit"
              loading={submitting}
              fullWidth={false}
              data-testid="notice-hub-submit-btn"
            >
              {submitting
                ? isEditMode ? 'Saving…' : 'Publishing…'
                : isEditMode ? 'Save changes' : publishAt ? 'Schedule notice' : 'Publish notice'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              data-testid="notice-hub-cancel-btn"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </Stack>
  )
}
