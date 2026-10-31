/**
 * api/noticesApi.ts – data layer for the Notice Hub track.
 *
 * Rules:
 * - JSON endpoints use apiRequest<T>() from @/core/api (handles auth header + 401).
 * - Multipart/form-data endpoints (POST + PATCH notices, attachment download) use
 *   raw fetch() because apiRequest() only supports JSON bodies.
 * - Never hardcode tokens or credentials.
 * - All paths are relative to /api/v1 (apiRequest prepends this automatically).
 */

import { apiRequest, API_BASE_URL } from '@/core/api'
import { loadSession, saveSession } from '@/core/auth/session'
import type {
  NoticeView,
  NoticeList,
  NoticeStatus,
  DoubtView,
  DoubtList,
  ResponseView,
} from '../types'

// ── Internal: authenticated multipart fetch ───────────────────────────────────

async function multipartRequest<T>(
  path: string,
  method: 'POST' | 'PATCH',
  formData: FormData,
): Promise<T> {
  const session = loadSession()
  if (!session) {
    saveSession(null)
    window.location.assign('/login')
    throw new Error('Your session has expired. Please sign in again.')
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/json',
        // Do NOT set Content-Type — the browser sets it with the multipart boundary.
      },
      body: formData,
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('The server took too long to respond. Try again.')
    }
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  const data =
    res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401) {
      saveSession(null)
      window.location.assign('/login')
    }
    const e = data?.error
    throw new Error(
      e?.message ?? data?.detail ?? `Request failed (${res.status}).`,
    )
  }

  return data as T
}

// ── Internal: authenticated binary fetch (for attachment download) ────────────

async function binaryRequest(path: string): Promise<{ blob: Blob; filename: string }> {
  const session = loadSession()
  if (!session) {
    saveSession(null)
    window.location.assign('/login')
    throw new Error('Your session has expired. Please sign in again.')
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('The server took too long to respond. Try again.')
    }
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  if (!res.ok) {
    if (res.status === 401) {
      saveSession(null)
      window.location.assign('/login')
    }
    throw new Error(`Could not download attachment (${res.status}).`)
  }

  const blob = await res.blob()

  // Try to extract filename from Content-Disposition header
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i)
  const filename = match?.[1] ?? 'attachment'

  return { blob, filename }
}

// ── Notices ───────────────────────────────────────────────────────────────────

export interface ListNoticesParams {
  status?: NoticeStatus
  pinned?: boolean
  mine?: boolean
  cursor?: string
}

export async function listNotices(params?: ListNoticesParams): Promise<NoticeList> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.pinned !== undefined) q.set('pinned', String(params.pinned))
  if (params?.mine) q.set('mine', 'true')
  if (params?.cursor) q.set('cursor', params.cursor)
  const qs = q.size > 0 ? `?${q}` : ''
  return apiRequest<NoticeList>(`/noticehub/notices${qs}`)
}

export async function getNotice(noticeId: string): Promise<NoticeView> {
  return apiRequest<NoticeView>(`/noticehub/notices/${noticeId}`)
}

export interface CreateNoticeInput {
  title: string
  body: string
  pinned?: boolean
  /** ISO 8601 datetime string. Omit to publish immediately. */
  publish_at?: string
  attachment?: File
}

export async function createNotice(input: CreateNoticeInput): Promise<NoticeView> {
  const fd = new FormData()
  fd.append('title', input.title)
  fd.append('body', input.body)
  if (input.pinned !== undefined) fd.append('pinned', String(input.pinned))
  if (input.publish_at) fd.append('publish_at', input.publish_at)
  if (input.attachment) fd.append('attachment', input.attachment)
  return multipartRequest<NoticeView>('/noticehub/notices', 'POST', fd)
}

export interface UpdateNoticeInput {
  title?: string
  body?: string
  pinned?: boolean
  /** Only valid while notice is scheduled. */
  publish_at?: string
  /** 'archived' hides it; 'active' restores it. */
  status?: 'active' | 'archived'
  attachment?: File
  /** true = delete the current attachment. */
  remove_attachment?: boolean
}

export async function updateNotice(
  noticeId: string,
  input: UpdateNoticeInput,
): Promise<NoticeView> {
  const fd = new FormData()
  if (input.title !== undefined) fd.append('title', input.title)
  if (input.body !== undefined) fd.append('body', input.body)
  if (input.pinned !== undefined) fd.append('pinned', String(input.pinned))
  if (input.publish_at !== undefined) fd.append('publish_at', input.publish_at)
  if (input.status !== undefined) fd.append('status', input.status)
  if (input.attachment) fd.append('attachment', input.attachment)
  if (input.remove_attachment) fd.append('remove_attachment', 'true')
  return multipartRequest<NoticeView>(`/noticehub/notices/${noticeId}`, 'PATCH', fd)
}

export async function deleteNotice(noticeId: string): Promise<void> {
  await apiRequest<unknown>(`/noticehub/notices/${noticeId}`, { method: 'DELETE' })
}

/**
 * Downloads the attachment and triggers a browser Save dialog.
 * Returns the filename for UI confirmation.
 */
export async function downloadAttachment(noticeId: string): Promise<string> {
  const { blob, filename } = await binaryRequest(
    `/noticehub/notices/${noticeId}/attachment`,
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return filename
}

// ── Doubts ────────────────────────────────────────────────────────────────────

export interface ListDoubtsParams {
  answered?: boolean
  mine?: boolean
  cursor?: string
}

export async function listDoubts(
  noticeId: string,
  params?: ListDoubtsParams,
): Promise<DoubtList> {
  const q = new URLSearchParams()
  if (params?.answered !== undefined) q.set('answered', String(params.answered))
  if (params?.mine) q.set('mine', 'true')
  if (params?.cursor) q.set('cursor', params.cursor)
  const qs = q.size > 0 ? `?${q}` : ''
  return apiRequest<DoubtList>(`/noticehub/notices/${noticeId}/doubts${qs}`)
}

export async function createDoubt(
  noticeId: string,
  question: string,
): Promise<DoubtView> {
  return apiRequest<DoubtView>(`/noticehub/notices/${noticeId}/doubts`, {
    method: 'POST',
    json: { question },
  })
}

export async function updateDoubt(
  doubtId: string,
  question: string,
): Promise<DoubtView> {
  return apiRequest<DoubtView>(`/noticehub/doubts/${doubtId}`, {
    method: 'PATCH',
    json: { question },
  })
}

export async function deleteDoubt(doubtId: string): Promise<void> {
  await apiRequest<unknown>(`/noticehub/doubts/${doubtId}`, { method: 'DELETE' })
}

// ── Responses ─────────────────────────────────────────────────────────────────

export async function createResponse(
  doubtId: string,
  message: string,
): Promise<ResponseView> {
  return apiRequest<ResponseView>(`/noticehub/doubts/${doubtId}/response`, {
    method: 'POST',
    json: { message },
  })
}

export async function updateResponse(
  doubtId: string,
  message: string,
): Promise<ResponseView> {
  return apiRequest<ResponseView>(`/noticehub/doubts/${doubtId}/response`, {
    method: 'PATCH',
    json: { message },
  })
}

export async function deleteResponse(doubtId: string): Promise<void> {
  await apiRequest<unknown>(`/noticehub/doubts/${doubtId}/response`, {
    method: 'DELETE',
  })
}
