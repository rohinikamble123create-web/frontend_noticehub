import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { buildRoutes } from '@/app/routes';
import { saveSession } from '@/core/auth/session';
import type { Role } from '@/core/auth/authService';
import { afterEach, test, expect } from 'vitest';
function renderAt(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

function mockSession(role: Role) {
  saveSession({
    accessToken: 'test',
    expiresAt: Date.now() + 10_000,
    user: { id: 'u1', name: 'Test', email: 't@example.com', role },
  });
}

afterEach(() => {
  saveSession(null);
});

test('student accessing /admin redirects to /student', async () => {
  mockSession('student');
  renderAt('/admin');
  await waitFor(() => expect(screen.getByText(/student dashboard/i)).toBeInTheDocument());
});

test('faculty accessing /admin redirects to /faculty', async () => {
  mockSession('faculty');
  renderAt('/admin');
  await waitFor(() => expect(screen.getByText(/faculty dashboard/i)).toBeInTheDocument());
});

test('office staff accessing /admin redirects to /staff', async () => {
  mockSession('office_staff');
  renderAt('/admin');
  await waitFor(() => expect(screen.getByText(/staff dashboard/i)).toBeInTheDocument());
});

test('admin accessing /faculty redirects to /admin', async () => {
  mockSession('admin');
  renderAt('/faculty');
  await waitFor(() => expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument());
});
