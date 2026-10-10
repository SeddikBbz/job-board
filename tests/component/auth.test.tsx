import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthPanel } from '@/components/auth/auth-panel'
import { AuthRoleProvider } from '@/components/auth/auth-role'
import { RegisterForm } from '@/components/auth-forms'
import { PasswordField } from '@/components/password-field'

// Server actions need the server runtime; the form only needs something to call
vi.mock('@/app/(frontend)/(auth)/actions', () => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
  resetPasswordAction: vi.fn(),
}))

afterEach(cleanup)

const renderSignup = (openJobs = 0) =>
  render(
    <AuthRoleProvider>
      <RegisterForm siteKey="" />
      <AuthPanel openJobs={openJobs} />
    </AuthRoleProvider>,
  )

describe('sign up role toggle', () => {
  it('changes the panel benefits with the selected role', () => {
    renderSignup()
    expect(screen.getByText('Find jobs that fit your skills')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Employer'))
    expect(screen.getByText('Post a job in minutes')).toBeTruthy()
    expect(screen.queryByText('Find jobs that fit your skills')).toBeNull()

    fireEvent.click(screen.getByLabelText('Candidate'))
    expect(screen.getByText('Find jobs that fit your skills')).toBeTruthy()
  })

  it('shows the open jobs count only when it is meaningful', () => {
    renderSignup(3)
    expect(screen.queryByText(/open jobs right now/)).toBeNull()
    cleanup()
    renderSignup(42)
    expect(screen.getByText(/open jobs right now/)).toBeTruthy()
  })
})

describe('PasswordField', () => {
  it('shows and hides the password', () => {
    render(<PasswordField label="Password" name="password" />)
    const input = screen.getByLabelText('Password') as HTMLInputElement
    expect(input.type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input.type).toBe('password')
  })

  it('shows the rules only while typing a new password', () => {
    render(<PasswordField label="Password" name="password" showRules />)
    expect(screen.queryByText('At least 8 characters')).toBeNull()
    const input = screen.getByLabelText('Password')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(screen.getByText('At least 8 characters')).toBeTruthy()
    expect(screen.getByText('(not yet)')).toBeTruthy()
    fireEvent.change(input, { target: { value: 'abcdefgh' } })
    expect(screen.getByText('(done)')).toBeTruthy()
  })
})
