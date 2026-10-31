import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, Stack, Text } from '@/ui'
import { apiRequest } from '@/core/api'

interface Notice {
    notice_id: string
    title: string
    body: string
    created_by_name: string
    pinned: boolean
}

interface NoticeResponse {
    notices?: Notice[]
    items?: Notice[]
    data?: Notice[] | {
        notices?: Notice[]
        items?: Notice[]
    }
}

export function AskQuestionScreen() {
    const navigate = useNavigate()

    const [notices, setNotices] = useState<Notice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadNotices() {
            try {
                const data = await apiRequest<unknown>(
                    '/noticehub/notices'
                )

                let noticeList: unknown = []

                if (Array.isArray(data)) {
                    noticeList = data
                } else if (data && typeof data === 'object') {
                    const response = data as NoticeResponse

                    if (Array.isArray(response.notices)) {
                        noticeList = response.notices
                    } else if (Array.isArray(response.items)) {
                        noticeList = response.items
                    } else if (Array.isArray(response.data)) {
                        noticeList = response.data
                    } else if (response.data) {
                        noticeList = response.data.notices ??
                            response.data.items ?? []
                    }
                }

                setNotices(noticeList as Notice[])
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load notices.'
                )
            } finally {
                setLoading(false)
            }
        }

        loadNotices()
    }, [])

    return (
        <Stack gap={4}>
            <Text as="h1" size="2xl" weight="bold">
                Ask About a Notice
            </Text>

            <Text>
                Select a notice below to ask your question.
            </Text>

            {loading && <Text>Loading notices...</Text>}

            {error && (
                <Card>
                    <Text>{error}</Text>
                </Card>
            )}

            {!loading && !error && notices.length === 0 && (
                <Card>
                    <Text>No notices are available.</Text>
                </Card>
            )}

            {notices.map((notice) => (
                <div
                    key={notice.notice_id}
                    onClick={() =>
                        navigate(`/tracks/notice-hub/${notice.notice_id}`)
                    }
                    style={{ cursor: 'pointer' }}
                >
                    <Card>
                        <Stack gap={2}>
                            <Text weight="bold">
                                {notice.title}
                                {notice.pinned ? ' 📌' : ''}
                            </Text>

                            <Text>{notice.body}</Text>

                            <Text tone="textMuted">
                                Published by: {notice.created_by_name}
                            </Text>

                            <Text>Click here to ask a question →</Text>
                        </Stack>
                    </Card>
                </div>
            ))}
        </Stack>
    )
}