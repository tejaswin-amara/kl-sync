import sharp from 'sharp'

// Prefer an env-configured key; fall back to the public free-tier key.
// NOTE: the public key is shared by everyone and its monthly quota is regularly
// exhausted (OCR.space returns HTTP 429 / "E557 Monthly limit reached"), which
// makes auto-fill silently return nothing. Set your own free OCR_SPACE_API_KEY
// (https://ocr.space/ocrapi) for reliable captcha solving.
const API_KEYS = [
  process.env.OCR_SPACE_API_KEY,
  'K87899142388957',
  'helloworld',
  'K84080131488957',
  'K89025091488957'
].filter(Boolean) as string[];

// The KLU login captcha is a single pink colour (RGB 239,71,111) painted on a
// fully transparent background, so the PNG's alpha channel is a near-perfect
// text mask. We turn that mask into crisp black-on-white, upscaled with a white
// margin — OCR.space reads this far more reliably than the raw pink-on-
// transparent image (which it composites onto black). This is the load-bearing
// accuracy fix.
async function preprocessCaptcha(buffer: Buffer): Promise<Buffer> {
  const core = await sharp(buffer)
    .ensureAlpha()
    .extractChannel(3) // alpha: text ≈ 255, background = 0
    .trim({ threshold: 10 }) // crop to the glyph bounding box -> normalizes scale
    .resize(520, 180, { fit: 'fill', kernel: 'cubic' })
    .blur(1.0) // smooth the upscaled edges before binarizing
    .threshold(75) // binarize -> text = white (255), background = black (0)
    .negate() // -> black text on white
    .png()
    .toBuffer()
  // Re-open as a fresh raster so the white border renders correctly.
  return sharp(core)
    .extend({ top: 30, bottom: 30, left: 30, right: 30, background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer()
}

async function ocrSpace(buffer: Buffer, engine: 1 | 2): Promise<string> {
  const formData = new FormData()
  formData.append('base64Image', `data:image/png;base64,${buffer.toString('base64')}`)
  formData.append('language', 'eng')
  formData.append('isOverlayRequired', 'false')
  formData.append('OCREngine', String(engine))
  formData.append('scale', 'true')
  formData.append('filetype', 'PNG')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    for (const key of API_KEYS) {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { apikey: key },
        body: formData,
        signal: controller.signal,
      })
      const result = await response.json()

      if (result.error) {
        console.warn(`OCR.space error with key ${key}:`, result.error)
        continue // Try next key
      }
      if (result.IsErroredOnProcessing) {
        console.error('OCR.space processing error:', result.ErrorMessage)
        return ''
      }
      const parsedText = result.ParsedResults?.[0]?.ParsedText || ''
      if (parsedText) return parsedText;
    }
    return '' // All keys failed or returned empty
  } catch (fetchError) {
    console.error(`OCR.space engine ${engine} fetch failed:`, fetchError)
    return ''
  } finally {
    clearTimeout(timeoutId)
  }
}

// Normalize OCR output for this captcha: it is always lowercase letters, so map
// digit look-alikes back to letters, lowercase, and strip everything else.
function cleanCaptchaText(raw: string): string {
  return (raw || '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/2/g, 'z')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'b')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/vv/g, 'w')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .trim()
}

export async function solveCaptchaWithOCRSpace(base64Image: string): Promise<string> {
  try {
    const raw = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const inputBuffer = Buffer.from(raw, 'base64')

    // Clean the image first; fall back to the raw bytes if sharp fails.
    let ocrBuffer: Buffer = inputBuffer
    try {
      ocrBuffer = await preprocessCaptcha(inputBuffer)
    } catch (e) {
      console.error('Captcha preprocessing failed, using raw image:', e)
    }

    // Engine 2 reads words best; Engine 1 is a fallback when it returns nothing.
    let text = cleanCaptchaText(await ocrSpace(ocrBuffer, 2))
    if (!text) text = cleanCaptchaText(await ocrSpace(ocrBuffer, 1))
    return text
  } catch (error) {
    console.error('Captcha OCR failed:', error)
    return ''
  }
}
