import { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: "Screenshot Calculator | KL University Attendance Calculator",
  description: "Upload your attendance screenshot to extract subjects and calculate eligibility automatically.",
  keywords: ['Screenshot Attendance Calculator', 'OCR Attendance', 'Subject-wise Attendance', 'KL University'],
  alternates: {
    canonical: '/screenshot',
  },
}

export default function ScreenshotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
