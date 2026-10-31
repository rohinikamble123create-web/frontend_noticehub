import { defineTrack } from '@/core/tracks'
import { routes } from './routes'

export default defineTrack({
  id: 'notice-hub',
  title: 'Notice Hub',
  description: 'Describe what this track does.',
  team: 'Your Team Name',
  icon: '✨',
  routes,
})
