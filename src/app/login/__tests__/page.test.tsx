import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import LoginPage from '../page'
import '@testing-library/jest-dom'

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
      if (url === '/api/erp/captcha') {
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session-id' }),
          json: async () => ({ captchaImage: 'data:image/png;base64,mock' }),
        }
      }
      return { ok: true, json: async () => ({}) }
    })

    class MockFileReader {
      onloadend: (() => void) | null = null;
      onerror: ((error: unknown) => void) | null = null;
      result = 'data:image/png;base64,mock';

      readAsDataURL() {
        setTimeout(() => {
          if (this.onloadend) this.onloadend();
        }, 10);
      }
    }
    (global as unknown).FileReader = MockFileReader;
    (global as unknown).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
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
    expect(global.fetch).toHaveBeenCalledWith('/api/erp/captcha')

    // Override fetch mock for login failure
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      if (url === '/api/erp/captcha') {
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session-id' }),
          json: async () => ({ captchaImage: 'data:image/png;base64,mock' }),
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
    const studentIdInputs = screen.getAllByPlaceholderText(/210003xxxx/i)
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i)
    const captchaInputs = screen.getAllByPlaceholderText(/Enter captcha/i)

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
    expect(mockFetch).toHaveBeenCalledWith('/api/erp/captcha')

    // Verify loading state is reset
    expect(submitBtn).not.toBeDisabled()
  })

  it('should handle fetch attendance error correctly and refetch captcha', async () => {
    const user = userEvent.setup()

    const mockFetch = vi.fn().mockImplementation(async (url) => {
      if (url === '/api/erp/captcha') {
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session-id' }),
          json: async () => ({ captchaImage: 'data:image/png;base64,mock' }),
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
      if (url === '/api/erp/data') {
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
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i)
    const captchaInputs = screen.getAllByPlaceholderText(/Enter captcha/i)

    const studentIdInput = studentIdInputs.find(el => el.closest('div.lg\\:hidden') === null) || studentIdInputs[0]
    const passwordInput = passwordInputs.find(el => el.closest('div.lg\\:hidden') === null) || passwordInputs[0]
    const captchaInput = captchaInputs.find(el => el.closest('div.lg\\:hidden') === null) || captchaInputs[0]

    await user.type(studentIdInput, '2100030000')
    await user.type(passwordInput, 'password123')
    await user.type(captchaInput, 'abcd')

    // Submit login form
    const continueBtns = screen.getAllByRole('button', { name: /Continue/i })
    const continueBtn = continueBtns.find(el => el.closest('div.lg\\:hidden') === null) || continueBtns[0]
    
    // Clear mock calls to see what happens on attendance fetch
    mockFetch.mockClear()
    
    await user.click(continueBtn)

    // Assert error message
    await waitFor(() => {
      expect(screen.getAllByText('Failed to fetch attendance data')[0]).toBeInTheDocument()
    })

    // Verify it refetched captcha in the finally block
    expect(mockFetch).toHaveBeenCalledWith('/api/erp/captcha')

    // Verify loading state is reset
    expect(continueBtn).not.toBeDisabled()
  })

  it('handles captcha auto-solve failure gracefully', async () => {
    const user = userEvent.setup()
    
    const mockFetch = vi.fn().mockImplementation(async (url, options) => {
      if (url === '/api/erp/captcha') {
        if (options?.method === 'POST') {
          throw new Error('Auto-solve network error')
        }
        return {
          ok: true,
          headers: new Headers({ 'x-session-id': 'test-session' }),
          json: async () => ({ captchaImage: 'data:image/png;base64,mock' }),
        }
      }
      return { ok: true, json: async () => ({}) }
    })
    global.fetch = mockFetch

    render(<LoginPage />)
    
    // Wait for the captcha image to load so the button is enabled
    const autoSolveBtn = await screen.findByTitle('Auto-solve with OCR')
    await waitFor(() => expect(autoSolveBtn).not.toBeDisabled())
    
    await user.click(autoSolveBtn)

    await waitFor(() => {
      expect(screen.getByText('Auto-solve failed. Please enter manually.')).toBeInTheDocument()
    })
  })

  it('handles general captcha fetch failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockFetch = vi.fn().mockImplementation(async () => {
      throw new Error('Network error during initial captcha load')
    })
    global.fetch = mockFetch

    render(<LoginPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(screen.getByText('Failed to load CAPTCHA. Please try again.')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('handles unsuccessful captcha fetch (non-200 response)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockFetch = vi.fn().mockImplementation(async () => {
      return { ok: false }
    })
    global.fetch = mockFetch

    render(<LoginPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(screen.getByText('Failed to load CAPTCHA. Please try again.')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })
})
