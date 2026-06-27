import { NextRequest, NextResponse } from 'next/server'
import { solveCaptchaWithOCRSpace } from '@/lib/ocr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body
    
    if (!image) {
      return NextResponse.json(
        { success: false, message: 'Missing image data' },
        { status: 400 }
      )
    }

    const text = await solveCaptchaWithOCRSpace(image)
    
    return NextResponse.json({
      success: true,
      text: text
    })
  } catch (error: any) {
    console.error('Solve captcha error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to solve captcha' },
      { status: 500 }
    )
  }
}
