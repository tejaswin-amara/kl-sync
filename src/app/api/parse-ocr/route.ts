import { NextRequest, NextResponse } from 'next/server'
import { optimizeImageSize } from './image-utils'

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    if (!file) return NextResponse.json({ error: 'No image file provided' }, { status: 400 })

    let buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer)
    buffer = await optimizeImageSize(buffer as any)

    // OCR.space API Call
    const ocrFormData = new FormData()
    ocrFormData.append('apikey', OCR_SPACE_API_KEY || 'helloworld')
    ocrFormData.append('language', 'eng')
    ocrFormData.append('isOverlayRequired', 'false')
    ocrFormData.append('isTable', 'true')
    ocrFormData.append('scale', 'true')
    ocrFormData.append('detectOrientation', 'false')
    ocrFormData.append('file', new Blob([buffer], { type: 'image/png' }), 'image.png')

    const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: ocrFormData, signal: AbortSignal.timeout(30000) })
    const json = await res.json()
    if (!res.ok || json.IsErroredOnProcessing) throw new Error('OCR API Error')

    const extractedText = json.ParsedResults?.[0]?.ParsedText || ''
    
    // Minimal Ponytail Regex Parser for Attendance
    const parsedRecords = extractedText.split('\n')
      .map(line => line.trim())
      .filter(line => /^[a-zA-Z0-9-]{4,10}/.test(line)) // lines starting with a plausible course code
      .map(line => {
        // Regex extracts: Code, LTPS, Conducted, Attended
        const m = line.match(/^([a-zA-Z0-9-]+)\s+(.+?)\s+([LTPSltps])\s+(\d+)\s+(\d+)/)
        if (!m) return null
        const [_, code, name, type, cond, att] = m
        const conducted = parseInt(cond, 10)
        const attended = parseInt(att, 10)
        return {
          coursecode: code.toUpperCase(),
          coursename: name.trim(),
          type: type.toUpperCase(),
          timeslot: 'S-7-MA', academicyear: '2025-2026', semester: 'Odd Sem', status: 'N', tcbr: 0,
          totalConducted: conducted,
          totalAttended: attended,
          totalAbsent: Math.max(0, conducted - attended),
          percentage: conducted > 0 ? Math.round((attended / conducted) * 100) : 0,
          isValid: true, extractionConfidence: 1, rawData: line
        }
      }).filter(Boolean)

    return NextResponse.json({
      success: true, message: 'OCR extraction completed successfully', rawText: extractedText,
      records: parsedRecords, columns: {}, csvPreview: { headers: [], rows: [] }, debug: {}
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('OCR')) {
      return NextResponse.json({ success: false, error: 'OCR processing failed', details: 'OCR extraction failed for both engines.', debug: { fileType: 'image/png', errorType: 'Error' } }, { status: 500 })
    }
    return NextResponse.json({ error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}
