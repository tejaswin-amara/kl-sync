import { getCaptcha } from '../scraper';

describe('scraper.ts - getCaptcha Error Handling', () => {
  let fetchSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock fetch
    fetchSpy = vi.spyOn(global, 'fetch');
    // Mock console.error to keep test output clean and allow asserting it was called
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw an error and log to console if network fetch fails', async () => {
    const networkError = new Error('Network failure');
    fetchSpy.mockRejectedValueOnce(networkError);

    await expect(getCaptcha()).rejects.toThrow('Network failure');
    expect(consoleErrorSpy).toHaveBeenCalledWith('getCaptcha Error:', networkError);
  });

  it('should throw if CSRF token is not found in the HTML', async () => {
    // Mock successful fetch but return HTML without CSRF token
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      text: vi.fn().mockResolvedValue('<html><body><form></form></body></html>'),
    } as unknown as Response);

    await expect(getCaptcha()).rejects.toThrow('CSRF Token not found (ERP login page structure may have changed)');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should throw if captcha element/source is not found', async () => {
    // Mock successful fetch returning HTML with CSRF but no captcha image
    fetchSpy.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      text: vi.fn().mockResolvedValue('<html><body><input name="_csrf" value="test-token" /></body></html>'),
    } as unknown as Response);

    await expect(getCaptcha()).rejects.toThrow('Captcha element/source not found');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
