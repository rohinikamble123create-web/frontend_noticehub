import { useNavigate } from 'react-router'
import styles from './StudentDashboard.module.css'

export function StudentDashboard() {
    const navigate = useNavigate()

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Welcome to CampusOS! Stay updated with your campus.</p>
                </div>
            </header>

            <section className={styles.grid}>
                <button
                    className={styles.card}
                    onClick={() => navigate('/tracks/notice-hub')}
                >
                    <span>📢</span>
                    <h2>All Notices</h2>
                    <p>View campus announcements</p>
                </button>

                <button
                    className={styles.card}
                    onClick={() => navigate('/tracks/notice-hub/questions')}
                >
                    <span>💬</span>
                    <h2>Ask About a Notice</h2>
                    <p>Ask questions about notices</p>
                </button>

                <button className={styles.card} disabled>
                    <span>🔔</span>
                    <h2>Notifications</h2>
                    <p>Coming soon</p>
                </button>

                <button
                    className={styles.card}
                    onClick={() => navigate('/tracks/notice-hub')}
                >
                    <span>📄</span>
                    <h2>Important PDFs</h2>
                    <p>Find notice attachments</p>
                </button>
            </section>

            <section className={styles.recent}>
                <h2>Recent Campus Updates</h2>
                <p>Visit All Notices to see the latest announcements.</p>
                <button
                    className={styles.viewButton}
                    onClick={() => navigate('/tracks/notice-hub')}
                >
                    View All Notices
                </button>
            </section>
        </div>
    )
}