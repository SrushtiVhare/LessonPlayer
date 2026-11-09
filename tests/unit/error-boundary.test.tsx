import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '../../src/components/ui/ErrorBoundary.tsx'

function Boom(): never {
  throw new Error('boom')
}

describe('error screen', () => {
  it('sends the child home with a normal link', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { name: "Oops, let's try again" })).toHaveFocus()
    spy.mockRestore()
  })
})
