'use client'

import { useState, FormEvent, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { LTPSCalculator } from "@/components/attendance-calculator"
import Cookies from 'js-cookie'
import Script from 'next/script'

interface ComponentState {
  percentage: number | null
}

interface ComponentsState {
  lecture: ComponentState
  tutorial: ComponentState
  practical: ComponentState
  skilling: ComponentState
}

interface SavedResult {
  id: string;
  subject: string;
  components: ComponentsState;
  finalPercentage: number;
  date: string;
}

export default function LTPSCalculatorPage() {
  const [components, setComponents] = useState<ComponentsState>({
    lecture: { percentage: null },
    tutorial: { percentage: null },
    practical: { percentage: null },
    skilling: { percentage: null }
  })
  const [subjectName, setSubjectName] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [savedResults, setSavedResults] = useState<SavedResult[]>([])

  useEffect(() => {
    // Load saved results from cookies when component mounts
    const savedResultsJson = Cookies.get('ltpsCalculatorDrafts')
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
  }, [components])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormSubmitted(true)
    setShowResult(true)
    
    // Save result if subject name is provided and at least one component has a value
    if (subjectName.trim() && hasValidInput()) {
      saveResult(subjectName)
    }
  }

  const calculateFinalPercentage = (): number => {
    let totalWeight = 0
    let weightedSum = 0

    // Weights for each component
    const weights = {
      lecture: 1,
      tutorial: 0.25,
      practical: 0.5,
      skilling: 0.25
    }

    // Calculate weighted sum
    Object.entries(components).forEach(([key, value]) => {
      const componentKey = key as keyof ComponentsState
      const percentage = value.percentage
      
      if (percentage !== null) {
        const weight = weights[componentKey]
        totalWeight += weight
        weightedSum += percentage * weight
      }
    })

    // Return the weighted average
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  const saveResult = (subject: string) => {
    const finalPercentage = calculateFinalPercentage()
    
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
        components: JSON.parse(JSON.stringify(components)), // Deep copy to avoid reference issues
        finalPercentage,
        date: new Date().toLocaleDateString()
      }
    } else {
      // Create new draft
      const newResult: SavedResult = {
        id: Date.now().toString(),
        subject,
        components: JSON.parse(JSON.stringify(components)), // Deep copy to avoid reference issues
        finalPercentage,
        date: new Date().toLocaleDateString()
      }
      
      updatedResults = [...savedResults, newResult]
    }
    
    setSavedResults(updatedResults)
    
    // Save to cookies
    Cookies.set('ltpsCalculatorDrafts', JSON.stringify(updatedResults), { expires: 30 }) // Expires in 30 days
  }

  const deleteSavedResult = (id: string) => {
    const updatedResults = savedResults.filter(result => result.id !== id)
    setSavedResults(updatedResults)
    Cookies.set('ltpsCalculatorDrafts', JSON.stringify(updatedResults), { expires: 30 })
  }

  const loadSavedResult = (result: SavedResult) => {
    setComponents(result.components)
    setSubjectName(result.subject)
    setFormSubmitted(true)
    setShowResult(true)
  }

  const handleInputChange = (component: keyof ComponentsState, value: string) => {
    const percentage = value === '' ? null : Math.min(100, Math.max(0, parseFloat(value) || 0))
    setComponents(prev => ({
      ...prev,
      [component]: { percentage }
    }))
  }

  const hasValidInput = () => {
    return components.lecture.percentage !== null || 
           components.tutorial.percentage !== null || 
           components.practical.percentage !== null || 
           components.skilling.percentage !== null
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LTPS Attendance Calculator',
    url: 'https://klattendance.vercel.app/ltps',
    description: 'Calculate weighted attendance for Lecture, Tutorial, Practical, and Skilling components.',
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
        id="ltps-calc-jsonld"
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
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins letter-spacing-tight">LTPS Attendance Calculator</h1>
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
              <CardDescription className="font-outfit">Enter your attendance percentages for each component</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="space-y-2"
                  >
                    <h3 className="font-medium font-poppins">Lecture (100%)</h3>
                    <div className="w-full">
                      <div className="space-y-2">
                        <label htmlFor="lecture" className="text-sm font-medium font-outfit">
                          Lecture Attendance (%)
                        </label>
                        <Input
                          id="lecture"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={components.lecture.percentage === null ? '' : components.lecture.percentage}
                          onChange={(e) => handleInputChange('lecture', e.target.value)}
                          placeholder="Enter lecture attendance"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="space-y-2"
                  >
                    <h3 className="font-medium font-poppins">Tutorial (25%)</h3>
                    <div className="w-full">
                      <div className="space-y-2">
                        <label htmlFor="tutorial" className="text-sm font-medium font-outfit">
                          Tutorial Attendance (%)
                        </label>
                        <Input
                          id="tutorial"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={components.tutorial.percentage === null ? '' : components.tutorial.percentage}
                          onChange={(e) => handleInputChange('tutorial', e.target.value)}
                          placeholder="Enter tutorial attendance"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="space-y-2"
                  >
                    <h3 className="font-medium font-poppins">Practical (50%)</h3>
                    <div className="w-full">
                      <div className="space-y-2">
                        <label htmlFor="practical" className="text-sm font-medium font-outfit">
                          Practical Attendance (%)
                        </label>
                        <Input
                          id="practical"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={components.practical.percentage === null ? '' : components.practical.percentage}
                          onChange={(e) => handleInputChange('practical', e.target.value)}
                          placeholder="Enter practical attendance"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="space-y-2"
                  >
                    <h3 className="font-medium font-poppins">Skilling (25%)</h3>
                    <div className="w-full">
                      <div className="space-y-2">
                        <label htmlFor="skilling" className="text-sm font-medium font-outfit">
                          Skilling Attendance (%)
                        </label>
                        <Input
                          id="skilling"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={components.skilling.percentage === null ? '' : components.skilling.percentage}
                          onChange={(e) => handleInputChange('skilling', e.target.value)}
                          placeholder="Enter skilling attendance"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </motion.div>
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
          <LTPSCalculator components={components} />
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
                          <Badge variant={result.finalPercentage >= 85 ? "default" : result.finalPercentage >= 75 ? "secondary" : "destructive"} className={
                            result.finalPercentage >= 85 
                              ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 hover:bg-green-500/30 hover:dark:bg-green-500/40" 
                              : result.finalPercentage >= 75 
                                ? "bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400 hover:bg-yellow-500/30 hover:dark:bg-yellow-500/40"
                                : ""
                          }>
                            {result.finalPercentage.toFixed(2)}%
                          </Badge>
                          <span className="font-medium">{result.subject}</span>
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

