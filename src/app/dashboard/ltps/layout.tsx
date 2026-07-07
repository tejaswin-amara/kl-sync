import { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: "LTPS Calculator | KL University Attendance Calculator",
  description: "Calculate weighted attendance for Lecture, Tutorial, Practical, and Skilling components.",
  keywords: ['LTPS Calculator', 'Lecture Tutorial Practical Skilling', 'Weighted Attendance', 'KL University Attendance'],
  alternates: {
    canonical: '/ltps',
  },
}

export default function LTPSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
