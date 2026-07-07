import { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: "Simple Attendance Calculator | KL University Attendance Calculator",
  description: "Quickly calculate your attendance percentage and eligibility using total classes and attended classes.",
  keywords: ['Simple Attendance Calculator', 'Attendance Percentage', 'Exam Eligibility', '75% attendance', '85% attendance'],
  alternates: {
    canonical: '/simple',
  },
}

export default function SimpleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
