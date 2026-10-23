import { expect, test, type Page } from '@playwright/test'
import rawLesson from '../../src/lessons/space-fractions.json' with { type: 'json' }

test.beforeEach(async ({ page }) => {
  await page.route('**/api/generate-lesson', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(rawLesson),
    })
  })
})

async function start(page: Page) {
  await page.goto('/')
  await page.getByTestId('start-learning').click()
  await page.getByTestId('start-mission').click()
  await expect(page.getByText('Slide 2 of 7')).toBeVisible()
}

async function choose(page: Page, optionId: string) {
  await page.getByTestId(`choice-${optionId}`).click()
}

async function solveRest(page: Page) {
  await choose(page, 'three-fifths')
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
  await page.getByTestId('numeric-input').fill('5/8')
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
  await page.getByTestId('tick-3').click()
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
  await choose(page, 'seven-tenths')
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
}

test('completes the mission with correct answers', async ({ page }) => {
  await start(page)
  await choose(page, 'one-fourth')
  await page.getByTestId('check-answer').click()
  await expect(page.getByTestId('feedback')).toContainText('Amazing! You figured it out.')
  await page.getByTestId('next').click()
  await solveRest(page)
  await expect(page.getByTestId('score')).toContainText('5 out of 5')
  await expect(page.getByText('You finished 5 challenges.')).toBeVisible()
})

test('shows a hint after two mistakes and still accepts the right answer', async ({ page }) => {
  await start(page)
  await choose(page, 'one-third')
  await page.getByTestId('check-answer').click()
  await choose(page, 'four-over-one')
  await page.getByTestId('check-answer').click()
  await expect(page.getByTestId('feedback')).toContainText("Here's a little clue!")
  await choose(page, 'one-fourth')
  await page.getByTestId('check-answer').click()
  await expect(page.getByTestId('feedback')).toContainText('You found another way to learn!')
  await expect(page.getByTestId('next')).toBeEnabled()
})

test('reveals the answer after three mistakes and lets the child continue', async ({ page }) => {
  await start(page)
  for (const optionId of ['one-third', 'four-over-one', 'three-fourths']) {
    await choose(page, optionId)
    await page.getByTestId('check-answer').click()
  }
  await expect(page.getByTestId('feedback')).toContainText('The answer is 1/4.')
  await page.getByTestId('next').click()
  await expect(page.getByText('Slide 3 of 7')).toBeVisible()
})

test('keeps progress after a browser refresh', async ({ page }) => {
  await start(page)
  await choose(page, 'one-fourth')
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
  await expect(page.getByText('Slide 3 of 7')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Slide 3 of 7')).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByTestId('feedback')).toContainText('Amazing! You figured it out.')
})

test('does not duplicate the score when moving backward and forward', async ({ page }) => {
  await start(page)
  await choose(page, 'one-third')
  await page.getByTestId('check-answer').click()
  await choose(page, 'one-fourth')
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByTestId('next').click()
  await solveRest(page)
  await expect(page.getByTestId('score')).toContainText('4 out of 5')
  await expect(page.getByText('You finished 5 challenges.')).toBeVisible()
})

test('completes the mission on a tablet-sized screen', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await start(page)
  await choose(page, 'one-fourth')
  await page.getByTestId('check-answer').click()
  await page.getByTestId('next').click()
  await solveRest(page)
  await expect(page.getByTestId('score')).toContainText('5 out of 5')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('lets a child pick a world and keeps the same fraction answer', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hi, explorer!' })).toBeVisible()
  await page.screenshot({ path: 'test-results/theme-space-home.png', fullPage: true })

  await page.getByTestId('theme-dino').click()
  await expect(page.getByRole('heading', { name: 'Hi, dino friend!' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Egg Pieces' })).toBeVisible()
  await page.screenshot({ path: 'test-results/theme-dino-home.png', fullPage: true })
  await page.getByTestId('start-learning').click()
  await expect(page.getByText(/eggs cracked into equal pieces/i)).toBeVisible()
  await page.getByTestId('start-mission').click()
  await expect(page.getByRole('heading', { name: /piece of this egg is glowing/i })).toBeVisible()
  await choose(page, 'one-fourth')
  await page.getByTestId('check-answer').click()
  await expect(page.getByTestId('feedback')).toContainText('Amazing! You figured it out.')
  await page.screenshot({ path: 'test-results/theme-dino-task.png', fullPage: true })

  await page.goto('/')
  await page.getByTestId('theme-soccer').click()
  await expect(page.getByRole('heading', { name: 'Hi, soccer star!' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ball Pieces' })).toBeVisible()
  await page.screenshot({ path: 'test-results/theme-soccer-home.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/theme-soccer-phone.png', fullPage: true })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
