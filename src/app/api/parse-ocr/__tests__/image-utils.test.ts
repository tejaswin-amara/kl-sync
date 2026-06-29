import { optimizeImageSize } from '../image-utils'

describe('optimizeImageSize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the original buffer if its size is <= 2MB', async () => {
    // Create a dummy buffer smaller than 2MB
    const buffer = Buffer.alloc(1024)
    const result = await optimizeImageSize(buffer)
    expect(result).toBe(buffer)
  })

  it('should catch errors thrown when accessing buffer properties and return the original buffer', async () => {
    // Spy on console.error to verify the error is logged and to keep test output clean
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Create a mock Buffer that throws an error when accessing 'length'
    const mockBuffer = {} as Buffer
    Object.defineProperty(mockBuffer, 'length', {
      get: () => { throw new Error('Mock error when accessing length') }
    })

    const result = await optimizeImageSize(mockBuffer)

    expect(result).toBe(mockBuffer)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Image optimization failed, using original:', expect.any(Error))

    // Cleanup
    consoleErrorSpy.mockRestore()
  })
})
