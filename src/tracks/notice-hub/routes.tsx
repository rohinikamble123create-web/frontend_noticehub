import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  {
    index: true,
    lazy: async () => ({
      Component: (await import('./screens/HomeScreen')).HomeScreen,
    }),
  },
  {
    path: 'create',
    lazy: async () => ({
      Component: (await import('./screens/CreateNoticeScreen')).CreateNoticeScreen,
    }),
  },
  {
    path: 'questions',
    lazy: async () => ({
      Component: (await import('./screens/AskQuestionScreen')).AskQuestionScreen,
    }),
  },
  {
    path: ':id',
    lazy: async () => ({
      Component: (await import('./screens/NoticeDetailScreen')).NoticeDetailScreen,
    }),
  },
]