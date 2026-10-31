import { useState } from 'react'
import { Button, Stack, Text } from '@/ui'
import { useAuth } from '@/core/auth'
import type { DoubtView } from '../types'
import {
  updateDoubt,
  deleteDoubt,
  createResponse,
  updateResponse,
  deleteResponse,
} from '../api/noticesApi'
import styles from './DoubtItem.module.css'

interface DoubtItemProps {
  doubt: DoubtView
  /** email_id of the notice creator — used to determine who can answer */
  noticeCreatedBy: string
  onChanged: () => void
}

/**
 * Renders a single doubt with its response (if any).
 *
 * Role-aware actions:
 * - Doubt owner (unanswered only): edit question, delete doubt
 * - Notice publisher + admin: post / edit / delete response
 */
export function DoubtItem({ doubt, noticeCreatedBy, onChanged }: DoubtItemProps) {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin'
  const isDoubtOwner = user?.id === doubt.asked_by
  const canAnswer = isAdmin || user?.id === noticeCreatedBy

  // Question edit state
  const [editingQuestion, setEditingQuestion] = useState(false)
  const [questionDraft, setQuestionDraft] = useState(doubt.question)
  const [questionError, setQuestionError] = useState('')
  const [questionBusy, setQuestionBusy] = useState(false)

  // Response state
  const [editingResponse, setEditingResponse] = useState(false)
  const [responseDraft, setResponseDraft] = useState(
    doubt.response?.message ?? '',
  )
  const [responseError, setResponseError] = useState('')
  const [responseBusy, setResponseBusy] = useState(false)

  // ── Question handlers ────────────────────────────────────────────────────────

  async function handleSaveQuestion() {
    const trimmed = questionDraft.trim()
    if (trimmed.length < 5 || trimmed.length > 1000) {
      setQuestionError('Question must be 5–1000 characters.')
      return
    }
    setQuestionBusy(true)
    setQuestionError('')
    try {
      await updateDoubt(doubt.doubt_id, trimmed)
      setEditingQuestion(false)
      onChanged()
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'Could not save question.')
    } finally {
      setQuestionBusy(false)
    }
  }

  async function handleDeleteDoubt() {
    if (!window.confirm('Delete this question? This cannot be undone.')) return
    try {
      await deleteDoubt(doubt.doubt_id)
      onChanged()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete question.')
    }
  }

  // ── Response handlers ────────────────────────────────────────────────────────

  async function handleSubmitResponse() {
    const trimmed = responseDraft.trim()
    if (!trimmed || trimmed.length > 2000) {
      setResponseError('Response must be 1–2000 characters.')
      return
    }
    setResponseBusy(true)
    setResponseError('')
    try {
      if (doubt.response) {
        await updateResponse(doubt.doubt_id, trimmed)
      } else {
        await createResponse(doubt.doubt_id, trimmed)
      }
      setEditingResponse(false)
      onChanged()
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : 'Could not submit response.')
    } finally {
      setResponseBusy(false)
    }
  }

  async function handleDeleteResponse() {
    if (!window.confirm('Remove this response?')) return
    try {
      await deleteResponse(doubt.doubt_id)
      onChanged()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete response.')
    }
  }

  const askedDate = new Date(doubt.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={styles.doubt} data-testid="notice-hub-doubt-item">
      <Stack gap={3}>
        {/* Question */}
        {editingQuestion ? (
          <Stack gap={2}>
            <textarea
              className={styles.textarea}
              value={questionDraft}
              onChange={(e) => setQuestionDraft(e.target.value)}
              rows={3}
              maxLength={1000}
              aria-label="Edit question"
              data-testid="notice-hub-edit-question-input"
            />
            <Text size="xs" tone="textMuted">
              {questionDraft.trim().length}/1000 characters
            </Text>
            {questionError && (
              <Text size="sm" style={{ color: 'var(--color-danger)' }}>
                {questionError}
              </Text>
            )}
            <div className={styles.actions}>
              <Button
                size="sm"
                loading={questionBusy}
                onClick={handleSaveQuestion}
                data-testid="notice-hub-save-question-btn"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingQuestion(false)
                  setQuestionDraft(doubt.question)
                  setQuestionError('')
                }}
              >
                Cancel
              </Button>
            </div>
          </Stack>
        ) : (
          <Stack gap={1}>
            <Text weight="medium" className={styles.question}>
              {doubt.question}
            </Text>
            <Text size="sm" tone="textMuted" className={styles.meta}>
              Asked by {doubt.asked_by_name} · {askedDate}
            </Text>
            {/* Edit/Delete question (doubt owner, only if unanswered) */}
            {isDoubtOwner && !doubt.answered && (
              <div className={styles.actions}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingQuestion(true)
                    setQuestionDraft(doubt.question)
                  }}
                  data-testid="notice-hub-edit-question-btn"
                >
                  Edit question
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDeleteDoubt}
                  data-testid="notice-hub-delete-question-btn"
                >
                  Delete
                </Button>
              </div>
            )}
          </Stack>
        )}

        {/* Response */}
        {doubt.response && !editingResponse && (
          <div className={styles.response}>
            <Stack gap={1}>
              <Text size="sm" weight="medium" tone="textMuted">
                ↩ {doubt.response.responded_by_name} ({doubt.response.responded_by_role})
              </Text>
              <Text className={styles.responseText}>{doubt.response.message}</Text>
              {canAnswer && (
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingResponse(true)
                      setResponseDraft(doubt.response!.message)
                    }}
                    data-testid="notice-hub-edit-response-btn"
                  >
                    Edit response
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleDeleteResponse}
                    data-testid="notice-hub-delete-response-btn"
                  >
                    Delete response
                  </Button>
                </div>
              )}
            </Stack>
          </div>
        )}

        {/* Answer form (publisher/admin, no response yet OR editing) */}
        {canAnswer && (editingResponse || !doubt.response) && (
          <div className={styles.answerForm}>
            <Stack gap={2}>
              <Text size="sm" weight="medium">
                {doubt.response ? 'Edit response' : 'Write a response'}
              </Text>
              <textarea
                className={styles.textarea}
                value={responseDraft}
                onChange={(e) => setResponseDraft(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Type your response…"
                aria-label="Response"
                data-testid="notice-hub-response-input"
              />
              {responseError && (
                <Text size="sm" style={{ color: 'var(--color-danger)' }}>
                  {responseError}
                </Text>
              )}
              <div className={styles.actions}>
                <Button
                  size="sm"
                  loading={responseBusy}
                  onClick={handleSubmitResponse}
                  data-testid="notice-hub-submit-response-btn"
                >
                  {doubt.response ? 'Update response' : 'Post response'}
                </Button>
                {editingResponse && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingResponse(false)
                      setResponseDraft(doubt.response?.message ?? '')
                      setResponseError('')
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Stack>
          </div>
        )}
      </Stack>
    </div>
  )
}
