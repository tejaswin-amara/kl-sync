import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LoginPage from '../page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock fetch for tests
global.fetch = jest.fn() as jest.Mock
const mockFetch = global.fetch as jest.Mock

describe('LoginPage Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    class MockFileReader {
      onloadend: (() => void) | null = null;
      onerror: ((error: any) => void) | null = null;
      result = 'data:image/png;base64,mock';

      readAsDataURL() {
        setTimeout(() => {
          if (this.onloadend) this.onloadend();
        }, 10);
      }
    }
    (global as any).FileReader = MockFileReader;
    (global as any).URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  })

  it('handles captcha auto-solve failure gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockImplementation(async (url) => {
      if (url === '/api/captcha') {
        return {
          ok: true,
          headers: { get: () => 'test-session' },
          blob: async () => new Blob(['test'])
        }
      }
      if (url === '/api/solve-captcha') {
        throw new Error('Auto-solve network error')
      }
      return { ok: true, json: async () => ({}) }
    })

    render(<LoginPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Captcha auto-solve failed', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('handles general captcha fetch failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockImplementationOnce(async () => {
      throw new Error('Network error during initial captcha load')
    })

    render(<LoginPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(screen.getByText('Failed to load CAPTCHA. Please try again.')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('handles unsuccessful captcha fetch (non-200 response)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockImplementationOnce(async () => {
      return { ok: false }
    })

    render(<LoginPage />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(screen.getByText('Failed to load CAPTCHA. Please try again.')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })
})
