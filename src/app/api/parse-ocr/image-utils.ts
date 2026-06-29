// Image size optimization to prevent timeouts
export async function optimizeImageSize(buffer: Buffer): Promise<Buffer> {
  try {
    // Check if image is too large (> 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB

    if (buffer.length <= maxSize) {
      return buffer
    }

    // In production, you could use Sharp or Canvas to resize the image
    // For now, we'll use the original and rely on timeout handling

    return buffer
  } catch (error) {
    console.error('Image optimization failed, using original:', error)
    return buffer
  }
}

// Image preprocessing for better OCR accuracy
export async function preprocessImageForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    // For now, return the original buffer
    // In a production environment, you could use libraries like Sharp or Canvas
    // to enhance contrast, adjust brightness, remove noise, etc.

    // Basic preprocessing steps that could be implemented:
    // 1. Convert to grayscale
    // 2. Increase contrast
    // 3. Adjust brightness
    // 4. Remove noise
    // 5. Sharpen text

    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError('Input must be a valid Buffer');
    }

    return buffer
  } catch (error) {
    console.error('Image preprocessing failed, using original:', error)
    return buffer
  }
}
