import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LoginPage from './page'
import { useRouter } from 'next/navigation'
import '@testing-library/jest-dom'

// Mock the useRouter hook
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('LoginPage', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
    })

    // Mock URL.createObjectURL since it's not available in jsdom
    global.URL.createObjectURL = vi.fn(() => 'mocked-url')

    // Partially mock global fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login form correctly', async () => {
    // Setup initial captcha fetch mock
    const mockBlob = new Blob(['fake image'], { type: 'image/png' })
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'x-session-id': 'mock-session' }),
      blob: async () => mockBlob,
    })

    render(<LoginPage />)
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('handles login API errors properly', async () => {
    const mockBlob = new Blob(['fake image'], { type: 'image/png' })

    // 1. Initial captcha fetch
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'x-session-id': 'mock-session' }),
      blob: async () => mockBlob,
    })

    render(<LoginPage />)

    // Wait for the captcha loading to finish to allow interacting with the form
    const submitBtn = screen.getByRole('button', { name: /continue/i })
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    // Fill the form
    const studentIdInput = screen.getByPlaceholderText('210003xxxx')
    const passwordInput = screen.getByPlaceholderText('Enter password')
    const captchaInput = screen.getByPlaceholderText('Auto-solving...')

    fireEvent.change(studentIdInput, { target: { value: 'user123' } })
    fireEvent.change(passwordInput, { target: { value: 'pass123' } })
    fireEvent.change(captchaInput, { target: { value: '1234' } })

    // Setup fetch mock for the login call and the subsequent captcha refresh
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      }) // login API call
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'x-session-id': 'mock-session' }),
        blob: async () => mockBlob,
      }) // captcha retry call

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles attendance fetch errors properly', async () => {
    const mockBlob = new Blob(['fake image'], { type: 'image/png' })

    // 1. Initial captcha fetch
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'x-session-id': 'mock-session' }),
      blob: async () => mockBlob,
    })

    render(<LoginPage />)

    const submitBtn = screen.getByRole('button', { name: /continue/i })
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    // Fill form and login successfully
    const studentIdInput = screen.getByPlaceholderText('210003xxxx')
    const passwordInput = screen.getByPlaceholderText('Enter password')
    const captchaInput = screen.getByPlaceholderText('Auto-solving...')

    fireEvent.change(studentIdInput, { target: { value: 'user123' } })
    fireEvent.change(passwordInput, { target: { value: 'pass123' } })
    fireEvent.change(captchaInput, { target: { value: '1234' } })

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sessionId: 'session-123',
        academicYears: [{ value: '2023-2024', label: '2023-2024' }],
        semesters: [{ value: 'odd', label: 'Odd Semester' }],
        csrfToken: 'token-123'
      }),
    })

    fireEvent.click(submitBtn)

    // Wait for the select semester form to appear
    await waitFor(() => {
      expect(screen.getByText('Select Period')).toBeInTheDocument()
    })

    // Mock fetch attendance API failure and subsequent captcha refresh
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'Server error fetching attendance' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'x-session-id': 'mock-session' }),
        blob: async () => mockBlob,
      })

    const loadAttendanceBtn = screen.getByRole('button', { name: /load attendance/i })
    fireEvent.click(loadAttendanceBtn)

    await waitFor(() => {
      expect(screen.getByText('Server error fetching attendance')).toBeInTheDocument()
    })
  })

  it('handles captcha auto-solve failure gracefully', async () => {
    // Mock the initial captcha fetch
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          headers: new Headers({ 'x-session-id': 'mock-session-id' }),
          blob: () => Promise.resolve(new Blob(['mock-blob'])),
        })
      )
      // Mock the solve-captcha API call to fail
      .mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(function(this: FileReader) {
        setTimeout(() => {
          Object.defineProperty(this, 'result', { value: 'data:image/png;base64,mock', writable: true });
          if (this.onloadend) {
            this.onloadend({} as ProgressEvent<FileReader>);
          }
        }, 0);
      }),
    };
    global.FileReader = vi.fn(() => mockFileReader) as unknown as typeof FileReader;

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<LoginPage />);

    // Wait for the captcha auto-solve error to be logged
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Captcha auto-solve failed',
        expect.any(Error)
      );
    });

    // Auto-solve failed, but the input should still be rendered and empty
    const captchaInput = screen.getByPlaceholderText('Auto-solving...');
    expect(captchaInput).toHaveValue('');
  })

  it('handles general captcha load failure', async () => {
    // Mock the initial captcha fetch to fail
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<LoginPage />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load CAPTCHA. Please try again.')).toBeInTheDocument();
    });
  })
})
