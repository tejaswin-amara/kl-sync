import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LoginPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'mocked-url');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles captcha auto-solve failure gracefully', async () => {
    // Mock the initial captcha fetch
    global.fetch = jest.fn() as jest.Mock;
    (global.fetch as jest.Mock)
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
      readAsDataURL: jest.fn(function(this: FileReader) {
        setTimeout(() => {
          Object.defineProperty(this, 'result', { value: 'data:image/png;base64,mock', writable: true });
          if (this.onloadend) {
            this.onloadend({} as ProgressEvent<FileReader>);
          }
        }, 0);
      }),
    };
    global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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

    consoleSpy.mockRestore();
  });

  it('handles general captcha load failure', async () => {
    // Mock the initial captcha fetch to fail
    global.fetch = jest.fn() as jest.Mock;
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<LoginPage />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load CAPTCHA. Please try again.')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
