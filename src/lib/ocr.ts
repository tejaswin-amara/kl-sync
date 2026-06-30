// Ensure the OCR_SPACE_API_KEY is configured in the environment.
// Set your own free OCR_SPACE_API_KEY (https://ocr.space/ocrapi)
// for reliable captcha solving.
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY

async function ocrSpace(base64Data: string, engine: 1 | 2): Promise<string> {
  if (!OCR_SPACE_API_KEY) {
    console.error('OCR_SPACE_API_KEY is not set')
    return ''
  }

  const formData = new FormData()
  formData.append('base64Image', base64Data)
  formData.append('language', 'eng')
  formData.append('isOverlayRequired', 'false')
  formData.append('OCREngine', String(engine))
  formData.append('scale', 'true')
  formData.append('filetype', 'PNG')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s per engine

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: OCR_SPACE_API_KEY },
      body: formData,
      signal: controller.signal,
    })
    const result = await response.json()

    // Quota/rate-limit responses come back as a top-level `error` (often with a
    // 4xx status) rather than IsErroredOnProcessing — surface it clearly.
    if (result.error) {
      console.error('OCR.space error:', result.error)
      return ''
    }
    if (result.IsErroredOnProcessing) {
      console.error('OCR.space processing error:', result.ErrorMessage)
      return ''
    }
    return result.ParsedResults?.[0]?.ParsedText || ''
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
    .toLowerCase()
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
    .replace(/[^a-z]/g, '')
    .trim()
}

export async function solveCaptchaWithOCRSpace(base64Image: string): Promise<string> {
  try {
    // Run both engines in parallel to save time.
    // Engine 2 reads words best; Engine 1 is a fallback.
    const [res2, res1] = await Promise.all([
      ocrSpace(base64Image, 2).then(cleanCaptchaText),
      ocrSpace(base64Image, 1).then(cleanCaptchaText)
    ])
    return res2 || res1 || ''
  } catch (error) {
    console.error('Captcha OCR failed:', error)
    return ''
  }
}
