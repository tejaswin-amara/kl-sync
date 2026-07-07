'use client'

import { useState, FormEvent, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { SimpleCalculator } from '@/components/attendance-calculator'
import Cookies from 'js-cookie'
import Script from 'next/script'

interface SavedResult {
  id: string;
  subject: string;
  totalClasses: number;
  presents: number;
  percentage: number;
  date: string;
}

export default function SimpleCalculatorPage() {
  const [totalClasses, setTotalClasses] = useState<number | null>(null)
  const [presents, setPresents] = useState<number | null>(null)
  const [subjectName, setSubjectName] = useState<string>('')
  const [showResult, setShowResult] = useState<boolean>(false)
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)
  const [savedResults, setSavedResults] = useState<SavedResult[]>([])

  useEffect(() => {
    // Load saved results from cookies when component mounts
    const savedResultsJson = Cookies.get('simpleCalculatorDrafts')
    if (savedResultsJson) {
      try {
        const parsed = JSON.parse(savedResultsJson)
        setSavedResults(parsed)
      } catch (e) {
        console.error('Failed to parse saved results', e)
      }
    }
  }, [])

  // Hide results when input values change
  useEffect(() => {
    if (formSubmitted) {
      setShowResult(false)
    }
  }, [totalClasses, presents])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormSubmitted(true)
    setShowResult(true)
    
    // Save result if subject name is provided
    if (subjectName.trim() && totalClasses && presents) {
      saveResult(totalClasses, presents, subjectName)
    }
  }

  const saveResult = (totalClasses: number, presents: number, subject: string) => {
    const percentage = (presents / totalClasses) * 100
    
    // Check if a draft with the same subject name already exists
    const existingDraftIndex = savedResults.findIndex(result => 
      result.subject.toLowerCase() === subject.toLowerCase()
    )
    
    let updatedResults
    
    if (existingDraftIndex !== -1) {
      // Update existing draft
      updatedResults = [...savedResults]
      updatedResults[existingDraftIndex] = {
        ...updatedResults[existingDraftIndex],
        totalClasses,
        presents,
        percentage,
        date: new Date().toLocaleDateString()
      }
    } else {
      // Create new draft
      const newResult: SavedResult = {
        id: Date.now().toString(),
        subject,
        totalClasses,
        presents,
        percentage,
        date: new Date().toLocaleDateString()
      }
      
      updatedResults = [...savedResults, newResult]
    }
    
    setSavedResults(updatedResults)
    
    // Save to cookies
    Cookies.set('simpleCalculatorDrafts', JSON.stringify(updatedResults), { expires: 30 }) // Expires in 30 days
  }

  const deleteSavedResult = (id: string) => {
    const updatedResults = savedResults.filter(result => result.id !== id)
    setSavedResults(updatedResults)
    Cookies.set('simpleCalculatorDrafts', JSON.stringify(updatedResults), { expires: 30 })
  }

  const loadSavedResult = (result: SavedResult) => {
    setTotalClasses(result.totalClasses)
    setPresents(result.presents)
    setSubjectName(result.subject)
    setFormSubmitted(true)
    setShowResult(true)
  }

  const hasValidInput = () => {
    return totalClasses !== null && presents !== null && totalClasses > 0 && presents > 0
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Simple Attendance Calculator',
    url: 'https://klattendance.vercel.app/simple',
    description: 'Calculate your simple attendance percentage based on total classes and attended classes.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Person',
      name: 'Jayakanth Kamisetti',
      url: 'https://jayakanthkamisetti.com'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  }

  return (
    <div className="w-full space-y-6 mx-auto max-w-[576px] px-4">
      <Script
        id="simple-calc-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <motion.div 
        className="flex flex-wrap items-center justify-center gap-2 mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative inline-block">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins letter-spacing-tight">Simple Attendance Calculator</h1>
          <motion.div
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full"
      >
        <div className="gradient-glow w-full">
          <Card className="w-full bg-card/90 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="font-poppins font-semibold">Calculate Attendance</CardTitle>
              <CardDescription className="font-outfit">Enter your total classes and classes attended</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                  <div className="space-y-2">
                    <label htmlFor="totalClasses" className="text-sm font-medium font-outfit">
                      Total Classes
                    </label>
                    <Input
                      id="totalClasses"
                      type="number"
                      min="0"
                      value={totalClasses === null ? '' : totalClasses}
                      onChange={(e) => setTotalClasses(e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="Enter total classes"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="presents" className="text-sm font-medium font-outfit">
                      Classes Attended
                    </label>
                    <Input
                      id="presents"
                      type="number"
                      min="0"
                      max={totalClasses || undefined}
                      value={presents === null ? '' : presents}
                      onChange={(e) => setPresents(e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="Enter classes attended"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subjectName" className="text-sm font-medium font-outfit flex items-center gap-2">
                    Subject Name 
                    <span className="text-xs text-muted-foreground">(Optional - to save as draft)</span>
                  </label>
                  <Input
                    id="subjectName"
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Enter subject name to save as draft"
                    className="w-full"
                  />
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-auto"
                >
                  <Button type="submit" className="w-full">Calculate</Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {showResult && formSubmitted && hasValidInput() && (
        <motion.div 
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SimpleCalculator totalClasses={totalClasses || 0} presents={presents || 0} />
        </motion.div>
      )}
      
      {savedResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full"
        >
          <div className="gradient-glow w-full">
            <Card className="w-full bg-card/90 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-poppins font-semibold text-lg">Saved Drafts</CardTitle>
                <CardDescription className="font-outfit">Click on a draft to load it</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => loadSavedResult(result)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={result.percentage >= 85 ? "default" : result.percentage >= 75 ? "secondary" : "destructive"} className={
                            result.percentage >= 85 
                              ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 hover:bg-green-500/30 hover:dark:bg-green-500/40" 
                              : result.percentage >= 75 
                                ? "bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400 hover:bg-yellow-500/30 hover:dark:bg-yellow-500/40"
                                : ""
                          }>
                            {result.percentage.toFixed(2)}%
                          </Badge>
                          <span className="font-medium">{result.subject}</span>
                          <span className="text-xs text-muted-foreground">({result.presents}/{result.totalClasses})</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Saved on {result.date}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => deleteSavedResult(result.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
} 

