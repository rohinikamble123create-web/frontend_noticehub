/**
 * types.ts – shared TypeScript interfaces for the Notice Hub track.
 * All shapes are derived directly from the live OpenAPI spec at
 * https://campus-os-backend-8sjf.onrender.com/openapi.json
 * Do not add or rename fields here without updating the spec reference.
 */

// ── Attachment ────────────────────────────────────────────────────────────────

export interface AttachmentView {
  attachment_id: string
  filename: string
  content_type: string
  size_bytes: number
  /** Short-lived signed URL. Use GET /notices/{id}/attachment to download. */
  url: string
}

// ── Notices ───────────────────────────────────────────────────────────────────

export type NoticeStatus = 'scheduled' | 'active' | 'archived'

export interface NoticeView {
  notice_id: string
  title: string
  body: string
  status: NoticeStatus
  pinned: boolean
  publish_at: string           // ISO 8601 datetime string
  attachment: AttachmentView | null
  created_by: string           // email_id of creator
  created_by_name: string
  created_by_role: string
  created_at: string
  updated_at: string
}

export interface NoticeList {
  count: number
  /** Pass as ?cursor= to fetch the next page. null = no more pages. */
  next_cursor: string | null
  items: NoticeView[]
}

// ── Doubts / Q&A ──────────────────────────────────────────────────────────────

export interface ResponseView {
  message: string
  responded_by: string
  responded_by_name: string
  responded_by_role: string
  responded_at: string
  updated_at: string
}

export interface DoubtView {
  doubt_id: string
  notice_id: string
  question: string
  asked_by: string             // email_id of asker
  asked_by_name: string
  asked_by_role: string
  answered: boolean
  response: ResponseView | null
  created_at: string
  updated_at: string
}

export interface DoubtList {
  count: number
  next_cursor: string | null
  items: DoubtView[]
}
