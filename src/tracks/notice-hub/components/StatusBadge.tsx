import type { NoticeStatus } from '../types'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: NoticeStatus
  pinned?: boolean
}

/**
 * Renders small pill badges for notice status and pinned state.
 * Styled exclusively with design-token CSS custom properties.
 */
export function StatusBadge({ status, pinned }: StatusBadgeProps) {
  return (
    <>
      {pinned && (
        <span className={`${styles.badge} ${styles.pinned}`} aria-label="Pinned notice">
          📌 Pinned
        </span>
      )}
      {status === 'scheduled' && (
        <span className={`${styles.badge} ${styles.scheduled}`} aria-label="Scheduled notice">
          🕐 Scheduled
        </span>
      )}
      {status === 'archived' && (
        <span className={`${styles.badge} ${styles.archived}`} aria-label="Archived notice">
          📦 Archived
        </span>
      )}
    </>
  )
}
