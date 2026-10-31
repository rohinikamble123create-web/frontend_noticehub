import { Card, Stack, Text } from '@/ui'
import type { NoticeView } from '../types'
import { StatusBadge } from './StatusBadge'
import styles from './NoticeCard.module.css'

interface NoticeCardProps {
  notice: NoticeView
  onClick: () => void
}

/**
 * Reusable summary card for a single notice.
 * Displays title, body preview, publisher, date, status badges and
 * an attachment indicator.
 */
export function NoticeCard({ notice, onClick }: NoticeCardProps) {
  const publishedDate = new Date(notice.publish_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card
      interactive
      className={styles.card}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      tabIndex={0}
      role="button"
      aria-label={`View notice: ${notice.title}`}
      data-testid="notice-hub-notice-card"
    >
      <Stack gap={3}>
        {/* Header: title + badges */}
        <div className={styles.header}>
          <Text as="h2" size="lg" weight="bold" className={styles.title}>
            {notice.title}
          </Text>
          <div className={styles.badges}>
            <StatusBadge status={notice.status} pinned={notice.pinned} />
          </div>
        </div>

        {/* Body preview */}
        <Text tone="textMuted" className={styles.body}>
          {notice.body}
        </Text>

        {/* Footer: meta info */}
        <div className={styles.footer}>
          <div className={styles.meta}>
            <Text size="sm" tone="textMuted">
              By <strong>{notice.created_by_name}</strong> ({notice.created_by_role})
            </Text>
            <Text size="sm" tone="textMuted">
              {publishedDate}
            </Text>
          </div>

          {notice.attachment && (
            <span className={styles.attachmentHint}>
              📎 {notice.attachment.filename}
            </span>
          )}
        </div>
      </Stack>
    </Card>
  )
}
