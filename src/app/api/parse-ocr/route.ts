import { NextRequest, NextResponse } from 'next/server'
import { optimizeImageSize, preprocessImageForOCR } from './image-utils'

// Use the OCR_SPACE_API_KEY from environment variables.
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY

// Define the maximum image size (default 2MB)
const MAX_IMAGE_SIZE_BYTES = process.env.MAX_IMAGE_SIZE_BYTES
  ? parseInt(process.env.MAX_IMAGE_SIZE_BYTES, 10) || 2 * 1024 * 1024
  : 2 * 1024 * 1024

const OCR_PRIMARY_TIMEOUT_MS = 30000 // 30 seconds for primary engine
const OCR_BACKUP_TIMEOUT_MS = 20000  // 20 seconds for backup engines

export async function POST(request: NextRequest) {
  try {
    if (!OCR_SPACE_API_KEY) {
      console.error('OCR_SPACE_API_KEY is not set')
      return NextResponse.json({ error: 'Server configuration error: OCR_SPACE_API_KEY is not set' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Optimize image size to prevent timeouts
      const optimizedBuffer = await optimizeImageSize(buffer)
      
      // Use OCR.space API for better table recognition
      const extractedText = await performOCRWithOCRSpace(optimizedBuffer)
      
      // Generate ID for this extraction
      const extractionId = `extraction_${Date.now()}`
      const allLines = extractedText.split('\n')


      // Parse attendance records from extracted text using our smart parser
      const parsedRecords = parseAttendanceText(extractedText)
      
      // Transform to column-based structure
      const columnData = {
        courseCode: [] as string[],
        courseName: [] as string[],
        type: [] as string[],
        timeSlot: [] as string[],
        academicYear: [] as string[],
        semester: [] as string[],
        status: [] as string[],
        totalConducted: [] as number[],
        totalAttended: [] as number[],
        totalAbsent: [] as number[],
        tcbr: [] as number[],
        percentage: [] as number[],
      }

      for (let i = 0, len = parsedRecords.length; i < len; i++) {
        const r = parsedRecords[i];
        columnData.courseCode.push(r.coursecode);
        columnData.courseName.push(r.coursename);
        columnData.type.push(r.type);
        columnData.timeSlot.push(r.timeslot);
        columnData.academicYear.push(r.academicyear);
        columnData.semester.push(r.semester);
        columnData.status.push(r.status);
        columnData.totalConducted.push(r.totalConducted);
        columnData.totalAttended.push(r.totalAttended);
        columnData.totalAbsent.push(r.totalAbsent);
        columnData.tcbr.push(r.tcbr);
        columnData.percentage.push(r.percentage);
      }

      // Prepare cleaned CSV preview rows (without Time Slot, Academic Year, Semester, Status)
      const csvHeaders = [
        'Course Code', 'Course Name', 'Type',
        'Total Classes', 'Attended Classes', 'Absent Classes', 'TCBR', 'Attendance Percentage'
      ]
      const csvRows = parsedRecords.map(r => [
        r.coursecode,
        r.coursename,
        r.type,
        r.totalConducted,
        r.totalAttended,
        r.totalAbsent,
        r.tcbr,
        `${r.percentage}%`
      ])
      
      return NextResponse.json({
        success: true,
        message: 'OCR extraction completed successfully',
        rawText: extractedText,
        textLength: extractedText.length,
        lines: extractedText.split('\n').length,
        rawLines: extractedText.split('\n'),
        numberOfLines: extractedText.split('\n').length,
        extractionId,
        records: parsedRecords,
        columns: columnData,
        csvPreview: { headers: csvHeaders, rows: csvRows },
        debug: {
          fileSize: buffer.length,
          fileType: file.type,
          ocrEngine: 'OCR.space'
        }
      })
    } catch (ocrError) {
      console.error('OCR recognition error:', ocrError)
      
      // Return detailed error information
      return NextResponse.json({
        success: false,
        error: 'OCR processing failed',
        details: ocrError instanceof Error ? ocrError.message : 'Unknown OCR error',
        debug: {
          fileSize: buffer.length,
          fileType: file.type,
          errorType: ocrError instanceof Error ? ocrError.constructor.name : 'Unknown'
        }
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Smart OCR processing error:', error)
    return NextResponse.json(
      { error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    )
  }
}

interface AttendanceRecord {
  coursecode: string
  coursename: string
  type: string // L, T, P, S (was ltps)
  timeslot: string // Time Slot like S-7-MA
  academicyear: string // Academic Year like 2025-2026
  semester: string
  status: string // Status like N
  totalConducted: number
  totalAttended: number
  totalAbsent: number
  tcbr: number // TCBR field
  percentage: number
  isValid?: boolean
  extractionConfidence?: number
  rawData?: string
}

interface StoredAttendanceData {
  id: string
  timestamp: string
  records: AttendanceRecord[]
  extractionMetadata: {
    totalRecords: number
    validRecords: number
    processingTime: number
    extractionMethod?: string
    ocrEngine?: string
  }
}

// Simple and robust parsing function
function smartParseAttendanceData(text: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const rawLines = text.split('\n')
  
  // Pre-process: Merge continuation lines
  // Some OCR results split a single row into multiple lines.
  // We look for lines that appear to be just numbers/stats and append them to the previous line.
  const mergedLines: string[] = []
  
  for (let i = 0; i < rawLines.length; i++) {
    let currentLine = rawLines[i].trim()
    if (!currentLine) continue

    // Look ahead for continuation lines
    while (i + 1 < rawLines.length) {
      const nextLine = rawLines[i + 1].trim()
      if (!nextLine) {
        i++
        continue
      }

      // Check if next line is a continuation
      // Criteria:
      // 1. Next line starts with a number
      // 2. Next line does NOT contain a course code pattern
      // 3. Next line consists mainly of numbers/percentages
      const isContinuation = isContinuationLine(nextLine)
      
      if (isContinuation) {
        currentLine += " " + nextLine
        i++ // Skip the merged line
      } else {
        break // Not a continuation, stop looking ahead
      }
    }
    mergedLines.push(currentLine)
  }


  // Process each merged line
  mergedLines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;


    // Skip obvious headers or garbage
    if (isHeaderLine(trimmedLine)) {
      return;
    }

    // Try to extract record using flexible strategy
    const record = extractRecordFromLine(trimmedLine, 'flexible');
    
    if (record) {
      
      // Check for duplicate course codes - keep the one with higher confidence
      const existingIndex = records.findIndex(r => r.coursecode === record.coursecode && r.type === record.type);
      if (existingIndex >= 0) {
          if ((record.extractionConfidence || 0) > (records[existingIndex].extractionConfidence || 0)) {
              records[existingIndex] = record;
          }
      } else {
          records.push(record);
      }
    } else {
    }
  });
  
  return records
}

// Helper to identify continuation lines (mostly numbers/stats)
function isContinuationLine(line: string): boolean {
  // If it matches a header, it's not a continuation
  if (isHeaderLine(line)) return false;

  // If it has a course code, it's a new record, not a continuation
  if (containsCourseCode(line)) return false;

  // Check if it looks like stats (numbers, percentages)
  // Allow spaces, %, digits, maybe some chars like 'N' (status)
  // Example: "24 0 0 100%" or "0 88%" or "N 16 14 2"
  const statsPattern = /^[\d\s%Nn.-]+$/;
  if (statsPattern.test(line)) return true;

  // Also check if it starts with a number and has high density of digits
  const digitCount = (line.match(/\d/g) || []).length;
  const totalCount = line.replace(/\s/g, '').length;
  
  if (totalCount > 0 && digitCount / totalCount > 0.5) return true;

  return false;
}

function containsCourseCode(line: string): boolean {
  // Simplified check for course code presence
  const parts = line.split(/\s+/);
  const courseCodePatterns = [
    /^[A-Z]{2,4}[0-9]{3,4}[A-Z]?$/,
    /^[A-Z]{3,5}[0-9]{2,4}$/,
    /^[A-Z]{2,3}-[0-9]{3,4}$/,
    /^[0-9]{2}[A-Z]{2,4}[0-9]{2,3}$/
  ];
  
  return parts.some(part => 
    courseCodePatterns.some(pattern => pattern.test(part.toUpperCase()))
  );
}

// Extract attendance record from a line using different strategies
function extractRecordFromLine(line: string, strategy: string): AttendanceRecord | null {
  const trimmedLine = line.trim()
  
  // Skip obvious header lines
  if (isHeaderLine(trimmedLine)) return null
  
  let parts: string[] = []
  
  switch (strategy) {
    case 'pipe':
      parts = trimmedLine.split('|').map(p => p.trim())
      break
    case 'space':
      parts = trimmedLine.split(/\s+/)
      break
    case 'table':
      parts = trimmedLine.split(/\s{2,}/) // Split on multiple spaces
      break
    case 'flexible':
      // Try to intelligently split the line
      parts = smartSplitLine(trimmedLine)
      break
    default:
      return null
  }
  
  // Extract required fields with validation
  const extracted = extractFields(parts, trimmedLine)
  if (!extracted) return null
  
  const { coursecode, coursename, ltps, totalConducted, totalAttended, confidence } = extracted
  
  // Calculate derived fields
  const totalAbsent = Math.max(0, totalConducted - totalAttended)
  const percentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 0

  return {
    coursecode,
    coursename,
    type: ltps,
    timeslot: 'S-7-MA', // Default value
    academicyear: '2025-2026', // Default value
    semester: 'Odd Sem', // Default value
    status: 'N', // Default value
    totalConducted,
    totalAttended,
    totalAbsent,
    tcbr: 0, // Default value
    percentage,
    isValid: confidence > 0.6,
    extractionConfidence: confidence,
    rawData: trimmedLine
  }
}

// Check if line is a header or unwanted content
function isHeaderLine(line: string): boolean {
  const lowerLine = line.toLowerCase()
  
  // Attendance table headers (keep these)
  const attendanceHeaders = [
    'course code', 'course name', 'attendance', 'conducted', 
    'attended', 'absent', 'l t p s', 'ltps', 'percentage',
    'subject', 'total', 'present', 'class', 'lecture'
  ]
  
  // Unwanted headers/content (filter these out)
  const unwantedHeaders = [
    'student name', 'roll number', 'semester', 'overall', 'section',
    'dashboard', 'navigation', 'menu', 'header', 'footer',
    'welcome', 'hello', 'logout', 'profile', 'settings',
    'notification', 'alert', 'message', 'status', 'update',
    'copyright', 'terms', 'privacy', 'policy', 'help',
    'search', 'filter', 'sort', 'view', 'edit', 'delete',
    'add', 'create', 'new', 'save', 'cancel', 'submit'
  ]
  
  // Check for unwanted content first
  const isUnwanted = unwantedHeaders.some(keyword => lowerLine.includes(keyword))
  if (isUnwanted) {
    return true // Mark as header to filter out
  }
  
  // Check for attendance-related headers
  const isAttendanceHeader = attendanceHeaders.some(keyword => lowerLine.includes(keyword))
  
  // Also check for lines that are clearly navigation or UI elements
  const isUIElement = /(?:click|tap|select|choose|go to|navigate|back|next|home)/i.test(line)
  
  // Check for lines with only symbols or formatting
  const isFormatting = /^[\s\-_=+|*#@$%^&()[\]{}.,;:!?'"<>\/\\]*$/.test(line)
  
  return isAttendanceHeader || isUIElement || isFormatting
}

// Smart line splitting
function smartSplitLine(line: string): string[] {
  // Try pipe first
  if (line.includes('|')) {
    return line.split('|').map(p => p.trim())
  }
  
  // Try tab
  if (line.includes('\t')) {
    return line.split('\t').map(p => p.trim())
  }
  
  // Try multiple spaces
  if (line.match(/\s{2,}/)) {
    const parts = line.split(/\s{2,}/)
    // Only use double-space split if it yields enough parts (likely a table row)
    // Otherwise, one accidental double space in a single-space line (like "DATA  SCIENCE")
    // would cause the line to be split into just 2 parts, failing extraction.
    if (parts.length >= 4) {
      return parts
    }
  }
  
  // Fall back to single space
  return line.split(/\s+/)
}

// Enhanced course code patterns
const courseCodePatterns = [
  { pattern: /^[A-Z]{2,4}[0-9]{3,4}[A-Z]?$/, isGeneric: false },  // Standard: CS101, MATH201A
  { pattern: /^[A-Z]{3,5}[0-9]{2,4}$/, isGeneric: false },        // Alternative: COMP101, ENGG1001
  { pattern: /^[A-Z]{2,3}-[0-9]{3,4}$/, isGeneric: false },       // With dash: CS-101, EE-201
  { pattern: /^[0-9]{2}[A-Z]{2,4}[0-9]{2,3}$/, isGeneric: false }, // Number first: 18CS101
  { pattern: /^[A-Z0-9-]{5,15}$/, isGeneric: true }               // Generic alphanumeric (catch-all)
]

// Extract and validate fields with enhanced smart detection
function extractFields(parts: string[], rawLine: string): {
  coursecode: string
  coursename: string
  ltps: string
  totalConducted: number
  totalAttended: number
  confidence: number
} | null {
  
  let coursecode = ''
  let coursename = ''
  let ltps = ''
  let totalConducted = 0
  let totalAttended = 0
  let confidence = 0
  
  // Find course code with multiple patterns
  let courseCodeIndex = -1
  for (const { pattern, isGeneric } of courseCodePatterns) {
    courseCodeIndex = parts.findIndex(part => pattern.test(part.toUpperCase()))
    if (courseCodeIndex >= 0) {
      coursecode = parts[courseCodeIndex].toUpperCase()
      // Higher confidence for specific patterns, lower for generic
      if (isGeneric) {
        confidence += 0.15
      } else {
        confidence += 0.3
      }
      break
    }
  }
  
  // If no standard pattern, look for alphanumeric codes
  if (!coursecode) {
    const alphanumericIndex = parts.findIndex(part => 
      /^[A-Z0-9]{4,8}$/i.test(part) && /[A-Z]/i.test(part) && /[0-9]/.test(part)
    )
    if (alphanumericIndex >= 0) {
      coursecode = parts[alphanumericIndex].toUpperCase()
      confidence += 0.2
      courseCodeIndex = alphanumericIndex
    }
  }
  
  // Enhanced course name detection
  if (courseCodeIndex >= 0) {
    // Look for course name in adjacent parts
    const possibleNames = []
    
    // Check next 1-3 parts for course name
    for (let i = courseCodeIndex + 1; i < Math.min(courseCodeIndex + 4, parts.length); i++) {
      const part = parts[i]
      // Skip if it's clearly not a course name (numbers, LTPS, etc.)
      if (!/^[0-9]+$/.test(part) && !/^[LTPS]$/i.test(part)) {
        possibleNames.push(part)
      } else {
        break // Stop at first non-name part
      }
    }
    
    if (possibleNames.length > 0) {
      coursename = possibleNames.join(' ').trim()
      confidence += 0.2
    }
  }
  
  // LTPS detection - only single characters (L, T, P, or S)
  const ltpsPattern = /^[LTPS]$/i  // Only single letter L, T, P, or S
  
  const ltpsIndex = parts.findIndex(part => ltpsPattern.test(part))
  if (ltpsIndex >= 0) {
    ltps = parts[ltpsIndex].toUpperCase()
    confidence += 0.2
  }
  
  // If no LTPS found, try to infer from context
  if (!ltps) {
    // Look for common LTPS values in the line
    const ltpsKeywords = ['lecture', 'tutorial', 'practical', 'lab', 'theory']
    const hasLtpsKeyword = ltpsKeywords.some(keyword => 
      rawLine.toLowerCase().includes(keyword)
    )
    if (hasLtpsKeyword) {
      ltps = 'L' // Default to lecture
      confidence += 0.1
    }
  }
  
  // Enhanced numeric value extraction
  const numbers = parts
    .filter(part => !part.includes('%')) // Exclude explicit percentages
    .map(part => {
      // Handle various number formats
      const cleaned = part.replace(/[^\d]/g, '')
      return parseInt(cleaned)
    })
    .filter(n => !isNaN(n) && n >= 0 && n <= 200) // Reasonable attendance range
  
  if (numbers.length >= 2) {
    // Sort numbers to identify conducted vs attended
    const sortedNumbers = [...numbers].sort((a, b) => b - a)
    
    // Conducted is usually the larger number
    totalConducted = sortedNumbers[0]
    
    // Attended is usually smaller or equal
    // Use second largest number directly to avoid picking totalConducted again
    totalAttended = sortedNumbers[1] || 0
    
    // Validate attendance logic
    if (totalAttended <= totalConducted) {
      confidence += 0.3
    } else {
      // Swap if logic is reversed
      [totalConducted, totalAttended] = [totalAttended, totalConducted]
      confidence += 0.2
    }
  } else if (numbers.length === 1) {
    // Only one number found, assume it's conducted
    totalConducted = numbers[0]
    totalAttended = 0
    confidence += 0.1
  }
  
  // Fallback: If no course code found but we have numbers and it looks like a row
  if (!coursecode && numbers.length >= 1) {
    // If first part is a number (index), take the second part
    if (/^\d+$/.test(parts[0]) && parts.length > 1) {
       const candidate = parts[1].replace(/[^A-Z0-9-]/gi, '').toUpperCase()
       if (candidate.length >= 2) {
         coursecode = candidate
         courseCodeIndex = 1
         confidence += 0.1
       }
    } else if (parts.length > 0) {
       // Just take the first part if it's not a number
       const candidate = parts[0].replace(/[^A-Z0-9-]/gi, '').toUpperCase()
       if (candidate.length >= 2 && !/^\d+$/.test(parts[0])) {
         coursecode = candidate
         courseCodeIndex = 0
         confidence += 0.1
       }
    }
  }

  // Enhanced validation with more flexible requirements
  const hasValidCourseCode = coursecode.length >= 2 // Relaxed from 3
  const hasValidCourseName = coursename.length >= 2 // Relaxed from 3
  const hasValidNumbers = totalConducted > 0
  
  // Calculate final confidence based on field quality
  if (hasValidCourseCode && hasValidCourseName && hasValidNumbers) {
    confidence += 0.2
  }
  
  // Minimum threshold for acceptance
  // Lowered threshold to 0.25 to catch more rows, relying on subsequent validation if needed
  if (!hasValidCourseCode || confidence < 0.25) {
    // If it has valid numbers and looks like a row (starts with digit), maybe we missed the course code
    // specific check for rows starting with index number
    const startsWithNumber = /^\d+$/.test(parts[0])
    if (startsWithNumber && hasValidNumbers && confidence >= 0.1) {
       // Accept it but mark as low confidence
       confidence += 0.1
    } else {
       return null
    }
  }
  
  // Set defaults for missing fields
  if (!coursename) {
    coursename = `Course ${coursecode}`
    confidence -= 0.1
  }
  
  if (!ltps) {
    ltps = 'L'
  }
  
  return {
    coursecode,
    coursename,
    ltps,
    totalConducted,
    totalAttended,
    confidence: Math.min(confidence, 1.0) // Cap at 1.0
  }
}



// Enhanced OCR.space API integration with better settings for character recognition
async function performOCRWithOCRSpace(buffer: Buffer): Promise<string> {
  if (!OCR_SPACE_API_KEY) throw new Error('OCR_SPACE_API_KEY is not set')
  try {
    // Check image size and optimize if needed
    const optimizedBuffer = await optimizeImageSize(buffer)
    
    // Preprocess the image for better OCR accuracy
    const preprocessedBuffer = await preprocessImageForOCR(optimizedBuffer)
    
    // Convert buffer to base64 for OCR.space API
    const base64Image = preprocessedBuffer.toString('base64')
    
    const formData = new FormData()
    formData.append('base64Image', `data:image/png;base64,${base64Image}`)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')
    formData.append('detectOrientation', 'true') // Enable orientation detection
    formData.append('isTable', 'true') // Enable table detection
    formData.append('OCREngine', '2') // Use OCR Engine 2 for better table structure detection
    formData.append('scale', 'true') // Scale image for better recognition
    formData.append('isCreateSearchablePdf', 'false')
    formData.append('isSearchablePdfHideTextLayer', 'false') // Preserve text structure
    formData.append('filetype', 'PNG') // Specify file type
    
    // Add timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OCR_PRIMARY_TIMEOUT_MS)
    
    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': OCR_SPACE_API_KEY
        },
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result = await response.json()
    
    if (result.IsErroredOnProcessing) {
      console.error('OCR.space error:', result.ErrorMessage)
      throw new Error(`OCR processing failed: ${result.ErrorMessage}`)
    }
    
    let extractedText = result.ParsedResults?.[0]?.ParsedText || ''
    
    // Apply post-processing to fix common OCR errors
    extractedText = postProcessOCRText(extractedText)
    
    // If OCR.space gives poor results, try with different engine
    if (extractedText.length < 100) {
      return await performOCRWithEngine1Fallback(buffer)
    }
    
    return extractedText
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // OCR.space request timed out, trying Engine 2...
      } else {
        console.error('OCR.space fetch failed:', fetchError)
      }
      throw fetchError
    }
  } catch (error) {
    console.error('OCR.space API failed, trying alternative approach:', error)
    // Try with different engine before falling back
    return performOCRWithEngine2(buffer)
  }
}

// Try OCR with Engine 1 as backup
async function performOCRWithEngine1Fallback(buffer: Buffer): Promise<string> {
  if (!OCR_SPACE_API_KEY) throw new Error('OCR_SPACE_API_KEY is not set')
  try {
    // Use the same optimization and preprocessing
    const optimizedBuffer = await optimizeImageSize(buffer)
    const preprocessedBuffer = await preprocessImageForOCR(optimizedBuffer)
    const base64Image = preprocessedBuffer.toString('base64')
    
    const formData = new FormData()
    formData.append('base64Image', `data:image/png;base64,${base64Image}`)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')
    formData.append('detectOrientation', 'true')
    formData.append('isTable', 'true')
    formData.append('OCREngine', '1') // Different engine
    formData.append('scale', 'true')
    formData.append('isCreateSearchablePdf', 'false')
    
    // Add timeout handling for Engine 2 as well
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OCR_BACKUP_TIMEOUT_MS)
    
    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': OCR_SPACE_API_KEY
        },
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
    
      const result = await response.json()
      
      if (result.IsErroredOnProcessing) {
        return fallbackOCR(buffer)
      }
      
      let extractedText = result.ParsedResults?.[0]?.ParsedText || ''
      extractedText = postProcessOCRText(extractedText)
      
      if (extractedText.length < 50) {
        return fallbackOCR(buffer)
      }
      
      return extractedText
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // OCR.space Engine 1 request timed out, using fallback...
      } else {
        console.error('OCR.space Engine 1 fetch failed:', fetchError)
      }
      throw fetchError
    }
  } catch (error) {
    console.error('Engine 1 failed, using fallback:', error)
    return fallbackOCR(buffer)
  }
}

// Try OCR with Engine 2 as an alternative helper
async function performOCRWithEngine2(buffer: Buffer): Promise<string> {
  if (!OCR_SPACE_API_KEY) throw new Error('OCR_SPACE_API_KEY is not set')
  try {
    // Reuse optimization and preprocessing steps
    const optimizedBuffer = await optimizeImageSize(buffer)
    const preprocessedBuffer = await preprocessImageForOCR(optimizedBuffer)
    const base64Image = preprocessedBuffer.toString('base64')

    const formData = new FormData()
    formData.append('base64Image', `data:image/png;base64,${base64Image}`)
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')
    formData.append('detectOrientation', 'true')
    formData.append('isTable', 'true')
    formData.append('OCREngine', '2') // Engine 2 for better table detection
    formData.append('scale', 'true')
    formData.append('isCreateSearchablePdf', 'false')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OCR_BACKUP_TIMEOUT_MS)

    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': OCR_SPACE_API_KEY
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()
      if (result.IsErroredOnProcessing) {
        return fallbackOCR(buffer)
      }

      let extractedText = result.ParsedResults?.[0]?.ParsedText || ''
      extractedText = postProcessOCRText(extractedText)

      if (extractedText.length < 50) {
        return fallbackOCR(buffer)
      }

      return extractedText
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // OCR.space Engine 2 helper timed out, using fallback...
      } else {
        console.error('OCR.space Engine 2 helper fetch failed:', fetchError)
      }
      throw fetchError
    }
  } catch (error) {
    console.error('Engine 2 helper failed, using fallback:', error)
    return fallbackOCR(buffer)
  }
}

// Post-process OCR text to fix common recognition errors
function postProcessOCRText(text: string): string {
  
  let processed = text
  
  // First, normalize line endings and remove excessive whitespace
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  // Fix common character recognition errors
    processed = processed.replace(/\b(\d{2})C[\/\|l1I\s](\d{3,4}[A-Z]*)\b/g, '$1CI$2') // e.g., 23C/2001 or 23CI2001 -> 23CI2001
  processed = processed.replace(/\b(\d{2}[A-Z]+)[\/\|l1I\s](\d{3,4}[A-Z]*)\b/g, '$1$2') // e.g., 23SC/3201 or 23SCI3201 -> 23SC3201
  
  // Fix other common OCR errors (avoid changing valid tokens like type 'S' or timeslot 'S-')
  processed = processed.replace(/\b([0-9OlSZ]+)\b/g, (match, _p1, offset, str) => {
    // Avoid changing valid tokens like timeslot 'S-'
    if (match === 'S' && str[offset + match.length] === '-') return match
    // Avoid changing valid standalone tokens like type 'S' or 'Z'
    if (match === 'S' || match === 'Z') return match

    return match
      .replace(/O/g, '0')
      .replace(/l/g, '1')
      .replace(/S/g, '5')
      .replace(/Z/g, '2')
  })
  
  // Fix letters inside numbers (e.g., '1O' -> '10', 'S1' -> '51')
  // We only replace if the token consists entirely of numbers and the specific letters,
  // to avoid corrupting course codes like 23CS235F
  processed = processed.replace(/\b[0-9OlSZB]+\b/g, match => {
    if (/[0-9]/.test(match)) {
      return match
        .replace(/O/g, '0')
        .replace(/l/g, '1')
        .replace(/S/g, '5')
        .replace(/Z/g, '2')
        .replace(/B/g, '8')
    }
    return match
  })

  // Process line by line to preserve structure
  const lines = processed.split('\n')
  
  const processedLines = lines.map((line, index) => {
    if (line.trim() === '') return line
    
    // Split by tabs or multiple spaces, but be more conservative
    const parts = line.split(/\t+|\s{3,}/)
    
    // If we have a data row (starts with number), ensure it has all columns
    if (/^\d+\s/.test(line.trim())) {
      // Expected structure: [Index, CourseCode, CourseName, Type, Section, Year, Semester, Status, Conducted, Attended, Absent, Extra, Percentage]
      // If we're missing the "Extra" column (often 0), add it
      if (parts.length >= 10 && parts.length <= 12) {
        // Check if we're missing the extra column before percentage
        const lastPart = parts[parts.length - 1]
        if (lastPart.includes('%')) {
          // Insert 0 before the percentage if missing
          if (parts.length === 11) {
            parts.splice(-1, 0, '0')
          }
        }
      }
      
      // Rejoin with tabs for consistency
      return parts.join('\t')
    }
    
    return line
  })
  
  processed = processedLines.join('\n')
  
  // Ensure proper spacing around numbers (but be careful not to break line structure)
  // Do NOT insert spaces inside course codes (e.g., 24SC3201).
  // Instead, collapse any accidentally separated course code tokens.
  // Examples fixed: "24 SC 3201" -> "24SC3201", "22 SDC 313R" -> "22SDC313R".
  // Join separated course code tokens that start with a 2-digit year while preserving preceding serial numbers
  processed = processed.replace(/(^|\s)(\d{2})\s+([A-Z]{2,5})\s+(\d{3,4})\s*([A-Z])?\b/g,
    (_m, p0, p1, p2, p3, p4) => `${p0}${p1}${p2}${p3}${p4 ? p4 : ''}`
  )
  // If any serial number was accidentally concatenated to course code (e.g., '1023SDC313R'), strip it
  processed = processed.replace(/\b\d{1,2}(\d{2}[A-Z]{2,5}\d{3,4}[A-Z]?)\b/g, '$1')
  
  // Fix percentage signs
  processed = processed.replace(/(\d+)\s+%/g, '$1%')
  
  // Clean up extra spaces but preserve tabs and line breaks
  // processed = processed.replace(/ {2,}/g, ' ') // DISABLED: Preserving table structure
  
  // Remove empty lines at the beginning and end, but preserve internal structure
  processed = processed.replace(/^\n+/, '').replace(/\n+$/, '')
  
  return processed
}

// Fallback OCR using a simple approach
async function fallbackOCR(buffer: Buffer): Promise<string> {
  // Return empty string or throw error to indicate OCR failure
  // We do not want to return hardcoded mock data for generic usage
  throw new Error('OCR extraction failed for both engines.')
}

function parseAttendanceText(text: string): AttendanceRecord[] {
  return smartParseAttendanceData(text)
}
