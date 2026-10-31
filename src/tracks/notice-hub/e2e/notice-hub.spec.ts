import { expect, test } from '../../../../e2e/fixtures'

test.describe('notice-hub track', () => {
  test('opens from the home grid', async ({ signedInPage: page }) => {
    await page.getByTestId('track-card-notice-hub').click()
    await expect(page).toHaveURL(/\/tracks\/notice-hub$/)
    await expect(page.getByRole('heading', { name: 'Notice Hub' })).toBeVisible()
  })
})
