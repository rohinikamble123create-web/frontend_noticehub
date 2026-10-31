import { describe, expect, it } from 'vitest'
import { renderRoute, screen } from '@/test/render'
import track from '../index'

describe('notice-hub track', () => {
  it('renders its home screen', async () => {
    renderRoute({ route: '/tracks/notice-hub', user: true, tracks: [track] })
    expect(await screen.findByRole('heading', { name: 'Notice Hub' })).toBeInTheDocument()
  })
})
