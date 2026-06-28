import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import LoginPage from '../page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('LoginPage Error Handling', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    // Setup initial fetch mock for useEffect's fetchCaptcha call
    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (url === '/api/captcha') {
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session-id' }),
          blob: async () => new Blob(['fake-image-data']),
        }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('should handle login error correctly and refetch captcha', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    // Initial fetchCaptcha call happens in useEffect
    expect(global.fetch).toHaveBeenCalledWith('/api/captcha')

    // Override fetch mock for login failure
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      if (url === '/api/captcha') {
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session-id' }),
          blob: async () => new Blob(['fake-image-data']),
        }
      }
      if (url === '/api/login') {
        return {
          ok: false,
          json: async () => ({ message: 'Invalid credentials provided by server' })
        }
      }
      return { ok: true, json: async () => ({}) }
    })

    global.fetch = mockFetch

    // Use getAllByPlaceholderText because it seems there are multiple rendered elements initially
    // due to multiple layout renders/hiding classes maybe (e.g. mobile vs desktop)
    const studentIdInputs = screen.getAllByPlaceholderText(/210003xxxx/i)
    const passwordInputs = screen.getAllByPlaceholderText(/Enter password/i)
    const captchaInputs = screen.getAllByPlaceholderText(/Auto-solving/i)

    const studentIdInput = studentIdInputs.find(el => el.closest('div.lg\\:hidden') === null) || studentIdInputs[0]
    const passwordInput = passwordInputs.find(el => el.closest('div.lg\\:hidden') === null) || passwordInputs[0]
    const captchaInput = captchaInputs.find(el => el.closest('div.lg\\:hidden') === null) || captchaInputs[0]

    await user.type(studentIdInput, '2100030000')
    await user.type(passwordInput, 'password123')
    await user.type(captchaInput, 'abcd')

    // Submit the form
    const submitBtns = screen.getAllByRole('button', { name: /Continue/i })
    const submitBtn = submitBtns.find(el => el.closest('div.lg\\:hidden') === null) || submitBtns[0]

    // Clear mock calls to only track form submission triggers
    mockFetch.mockClear()

    await user.click(submitBtn)

    // Assert error message
    await waitFor(() => {
      expect(screen.getAllByText('Invalid credentials provided by server')[0]).toBeInTheDocument()
    })

    // Verify it refetched captcha
    expect(mockFetch).toHaveBeenCalledWith('/api/captcha')

    // Verify loading state is reset
    expect(submitBtn).not.toBeDisabled()
  })

  it('should handle fetch attendance error correctly and refetch captcha', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn().mockImplementation(async (url) => {
      if (url === '/api/captcha') {
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session-id' }),
          blob: async () => new Blob(['fake-image-data']),
        }
      }
      if (url === '/api/login') {
        return {
          ok: true,
          json: async () => ({
            csrfToken: 'fake-csrf',
            academicYears: [{label: '2023-2024', value: '2023-2024'}],
            semesters: [{label: 'Even', value: 'Even'}]
          })
        }
      }
      if (url === '/api/fetch-attendance') {
        return {
           ok: false,
           json: async () => ({ message: 'Failed to fetch attendance data' })
        }
      }
      return { ok: true, json: async () => ({}) }
    })
    global.fetch = mockFetch

    render(<LoginPage />)

    const studentIdInputs = screen.getAllByPlaceholderText(/210003xxxx/i)
    const passwordInputs = screen.getAllByPlaceholderText(/Enter password/i)
    const captchaInputs = screen.getAllByPlaceholderText(/Auto-solving/i)

    const studentIdInput = studentIdInputs.find(el => el.closest('div.lg\\:hidden') === null) || studentIdInputs[0]
    const passwordInput = passwordInputs.find(el => el.closest('div.lg\\:hidden') === null) || passwordInputs[0]
    const captchaInput = captchaInputs.find(el => el.closest('div.lg\\:hidden') === null) || captchaInputs[0]

    await user.type(studentIdInput, '2100030000')
    await user.type(passwordInput, 'password123')
    await user.type(captchaInput, 'abcd')

    // Submit login form
    const continueBtns = screen.getAllByRole('button', { name: /Continue/i })
    const continueBtn = continueBtns.find(el => el.closest('div.lg\\:hidden') === null) || continueBtns[0]
    await user.click(continueBtn)

    // Now we should be on the select-sem step
    const loadBtns = await screen.findAllByRole('button', { name: /Load Attendance/i })
    const loadBtn = loadBtns.find(el => el.closest('div.lg\\:hidden') === null) || loadBtns[0]

    // Clear mock calls to see what happens on attendance fetch
    mockFetch.mockClear()

    await user.click(loadBtn)

    // Assert error message
    await waitFor(() => {
      expect(screen.getAllByText('Failed to fetch attendance data')[0]).toBeInTheDocument()
    })

    // Verify it refetched captcha in the finally block
    expect(mockFetch).toHaveBeenCalledWith('/api/captcha')

    // Verify loading state is reset
    expect(loadBtn).not.toBeDisabled()
  })
})
