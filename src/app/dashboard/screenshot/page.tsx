'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Image as ImageIcon, Loader2, Save, Trash2, AlertCircle, CheckCircle2, XCircle, Terminal, Eye, EyeOff, X } from "lucide-react"
import Image from 'next/image'
import Cookies from 'js-cookie'
import Script from 'next/script'

interface AttendanceRecord {
  coursecode: string
  coursename: string
  type: string
  timeslot: string
  academicyear: string
  semester: string
  status: string
  totalConducted: number
  totalAttended: number
  totalAbsent: number
  tcbr: number
  percentage: number
}

interface ColumnData {
  courseCode: string[]
  courseName: string[]
  type: string[]
  timeSlot: string[]
  academicYear: string[]
  semester: string[]
  status: string[]
  totalConducted: number[]
  totalAttended: number[]
  totalAbsent: number[]
  tcbr: number[]
  percentage: number[]
}

interface GroupedSubject {
  coursecode: string
  coursename: string
  components: {
    L?: AttendanceRecord
    T?: AttendanceRecord
    P?: AttendanceRecord
    S?: AttendanceRecord
  }
  finalPercentage: number
  status: string
  attendanceOptions?: AttendanceOption[]
  skippableClasses?: SkippableOption[]
}

interface AttendanceOption {
  L: number
  T: number
  P: number
  S: number
  total: number
  projectedPercentage?: number
  projectedAttended?: number
  projectedConducted?: number
}

interface SkippableOption {
  component: string
  count: number
  threshold: number // 75 or 85
}

interface SavedScreenshotResult {
  id: string
  name: string
  subjects: GroupedSubject[]
  date: string
}

export default function ScreenshotCalculatorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(true)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [groupedSubjects, setGroupedSubjects] = useState<GroupedSubject[]>([])
  const [columnData, setColumnData] = useState<ColumnData | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [rawLines, setRawLines] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saveName, setSaveName] = useState<string>('')
  const [savedResults, setSavedResults] = useState<SavedScreenshotResult[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[]>([])

  useEffect(() => {
    // Load saved results from cookies
    const savedResultsJson = Cookies.get('screenshotCalculatorDrafts')
    if (savedResultsJson) {
      try {
        const parsed = JSON.parse(savedResultsJson)
        setSavedResults(parsed)
      } catch (e) {
        console.error('Failed to parse saved results', e)
      }
    }
  }, [])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
      setAttendanceData([])
      setGroupedSubjects([])
      setRawText('')
      setRawLines([])
    }
  }

  const processImage = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)
    clearDebugLogs()
    addDebugLog('ðŸš€ Starting OCR processing...')
    addDebugLog(`ðŸ“ File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      addDebugLog('ðŸ“¦ FormData prepared, sending to API...')

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        addDebugLog('â° Request timeout (45s), aborting...')
        controller.abort()
      }, 45000) // 45 second timeout

      addDebugLog('ðŸŒ Sending POST request to /api/parse-ocr')
      const startTime = Date.now()
      
      const response = await fetch('/api/parse-ocr', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      addDebugLog(`ðŸ“¡ Response received in ${duration}ms, status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        addDebugLog(`âŒ HTTP Error: ${response.status} - ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      addDebugLog('ðŸ“„ Parsing JSON response...')
      const result = await response.json()
      addDebugLog(`âœ… Response parsed successfully`)
      
      if (result.success) {
        addDebugLog(`ðŸ“Š Raw text extracted: ${result.rawText?.length || 0} characters`)
        addDebugLog(`ðŸ“‹ Number of lines: ${result.numberOfLines || 0}`)
        setRawText(result.rawText || '')
        setRawLines(result.rawLines || [])
        
        // Set Column Data if available
        if (result.columnData) {
          addDebugLog('ðŸ“Š Column data received')
          setColumnData(result.columnData)
        }

        // Use parsed attendance records from API, if available
        const records: AttendanceRecord[] = Array.isArray(result.records) ? result.records : []
        if (records.length > 0) {
          addDebugLog(`ðŸ§® Parsed records received: ${records.length}`)
          setAttendanceData(records)
          const grouped = groupSubjectsByCode(records)
          addDebugLog(`ðŸ“š Grouped subjects: ${grouped.length}`)
          setGroupedSubjects(grouped)
          // Cleaned CSV preview
          const headers: string[] = Array.isArray(result.csvPreview?.headers) ? result.csvPreview.headers : [
            'Course Code','Course Name','Type','Total Classes','Attended Classes','Absent Classes','TCBR','Attendance Percentage'
          ]
          const rows: string[][] = Array.isArray(result.csvPreview?.rows) ? result.csvPreview.rows : []
          // Fallback: derive CSV rows from records if preview missing
          const derivedRows = rows.length > 0
            ? rows
            : records.map(r => [
                r.coursecode,
                r.coursename,
                r.type,
                String(r.totalConducted),
                String(r.totalAttended),
                String(r.totalAbsent),
                String(r.tcbr ?? 0),
                `${r.percentage}%`
              ])
          setCsvHeaders(headers)
          setCsvRows(derivedRows.map(r => r.map(String).join(',')))
        } else {
          addDebugLog('â„¹ï¸ No parsed records returned; showing raw text only')
          setAttendanceData([])
          setGroupedSubjects([])
          setCsvHeaders([])
          setCsvRows([])
        }
      } else {
        addDebugLog(`âŒ Processing failed: ${result.error || 'Unknown error'}`)
        setError(result.error || 'Failed to process image')
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          addDebugLog('â° Processing timeout - request aborted')
          setError('Processing timeout. The image might be too complex or large. Please try a smaller, clearer image.')
        } else {
          addDebugLog(`ðŸ’¥ Error: ${err.message}`)
          setError(`Failed to process image: ${err.message}`)
        }
      } else {
        addDebugLog('ðŸ’¥ Unknown error occurred')
        setError('Failed to process image. Please try again.')
      }
    } finally {
      addDebugLog('ðŸ Processing completed')
      setIsProcessing(false)
    }
  }

  const groupSubjectsByCode = (records: AttendanceRecord[]): GroupedSubject[] => {
    const grouped: { [key: string]: GroupedSubject } = {}

    records.forEach(record => {
      const key = record.coursecode
      
      if (!grouped[key]) {
        grouped[key] = {
          coursecode: record.coursecode,
          coursename: record.coursename,
          components: {},
          finalPercentage: 0,
          status: 'Not Eligible'
        }
      }

      // Add component data
      const componentType = record.type.toUpperCase() as 'L' | 'T' | 'P' | 'S'
      grouped[key].components[componentType] = record
    })

    // Calculate final percentage using LTPS weights or direct calculation
    Object.values(grouped).forEach(subject => {
      const components = Object.values(subject.components).filter(Boolean) as AttendanceRecord[]
      
      if (components.length > 1) {
        // LTPS Calculation (Weighted) for multiple components
        const weights = { L: 1, T: 0.25, P: 0.5, S: 0.25 }
        let totalWeight = 0
        let weightedSum = 0

        Object.entries(subject.components).forEach(([type, record]) => {
          if (record) {
            const weight = weights[type as keyof typeof weights]
            totalWeight += weight
            // Calculate percentage from raw numbers for consistency with projection logic
            const calculatedPct = record.totalConducted > 0 
              ? (record.totalAttended / record.totalConducted) * 100 
              : 0
            weightedSum += calculatedPct * weight
          }
        })

        subject.finalPercentage = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
      } else if (components.length === 1) {
        // Direct calculation for single component
        const record = components[0]
        subject.finalPercentage = record.totalConducted > 0 
          ? Math.round((record.totalAttended / record.totalConducted) * 100) 
          : 0
      } else {
        subject.finalPercentage = 0
      }
      
      // Determine status
      if (subject.finalPercentage >= 85) {
        subject.status = 'Eligible'
        // Calculate skippable classes for 75% and 85% (if > 85%)
        subject.skippableClasses = calculateSkippableClasses(subject)
      } else if (subject.finalPercentage >= 75) {
        subject.status = 'Conditional Eligibility'
        // Calculate skippable classes for 75%
        subject.skippableClasses = calculateSkippableClasses(subject)
      } else {
        subject.status = 'Not Eligible'
        // Calculate needed classes if not eligible
        subject.attendanceOptions = calculateAttendanceOptions(subject)
      }
    })

    return Object.values(grouped)
  }

  const calculateSkippableClasses = (subject: GroupedSubject): SkippableOption[] => {
    const weights = { L: 1, T: 0.25, P: 0.5, S: 0.25 }
    const thresholds = [75, 85]
    const options: SkippableOption[] = []

    const components = subject.components
    const hasMultiple = Object.values(components).filter(Boolean).length > 1

    // Helper to calculate weighted percentage after skipping classes
    const calculateProjectedPercentage = (skipped: { L: number, T: number, P: number, S: number }) => {
      let totalWeight = 0
      let weightedSum = 0

      if (!hasMultiple) {
         // Single component logic
         const type = Object.keys(components).find(k => components[k as keyof typeof components]) as keyof typeof components
         if (!type) return 0
         
         const record = components[type]!
         // Skipping: Attended stays same, Conducted increases (assuming we skip future classes)
         // Wait, "skipping" usually means we are absent for future classes.
         // So Attended stays same, Total Conducted increases by skipped amount.
         const newAttended = record.totalAttended
         const newConducted = record.totalConducted + skipped[type]
         return newConducted > 0 ? (newAttended / newConducted) * 100 : 0
      }

      // Multiple component logic (LTPS)
      Object.entries(components).forEach(([type, record]) => {
        if (record) {
          const t = type as keyof typeof weights
          const weight = weights[t]
          const newAttended = record.totalAttended // Attended doesn't change
          const newConducted = record.totalConducted + skipped[t] // Conducted increases
          const pct = newConducted > 0 ? (newAttended / newConducted) * 100 : 0
          
          totalWeight += weight
          weightedSum += pct * weight
        }
      })
      
      return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
    }

    thresholds.forEach(threshold => {
      // Only calculate if we are currently above this threshold
      if (subject.finalPercentage > threshold) {
        const types: (keyof typeof weights)[] = ['L', 'T', 'P', 'S']
        
        types.forEach(type => {
          if (subject.components[type]) {
            // How many classes of this type can we skip?
            let count = 0
            // Check up to a reasonable limit (e.g., 50)
            for (let i = 1; i <= 50; i++) {
              const skipped = { L: 0, T: 0, P: 0, S: 0 }
              skipped[type] = i
              const projected = calculateProjectedPercentage(skipped)
              
              if (projected >= threshold) {
                count = i
              } else {
                break // Percentage dropped below threshold
              }
            }
            
            if (count > 0) {
              options.push({
                component: type,
                count: count,
                threshold: threshold
              })
            }
          }
        })
      }
    })

    return options.sort((a, b) => b.threshold - a.threshold || b.count - a.count)
  }

  const calculateAttendanceOptions = (subject: GroupedSubject): AttendanceOption[] => {
    // We want to find combinations of (L, T, P, S) classes to attend to reach 75%
    // Prioritize single-component solutions and minimal total classes
    
    const weights = { L: 1, T: 0.25, P: 0.5, S: 0.25 }
    const target = 75
    const options: AttendanceOption[] = []
    
    // Helper to calculate weighted percentage and totals
    const calculateProjection = (added: { L: number, T: number, P: number, S: number }) => {
      let totalWeight = 0
      let weightedSum = 0
      let totalAttendedSum = 0
      let totalConductedSum = 0
      
      const components = subject.components
      // Check if we have multiple components or single
      const hasMultiple = Object.values(components).filter(Boolean).length > 1

      if (!hasMultiple) {
         // Single component logic
         const type = Object.keys(components).find(k => components[k as keyof typeof components]) as keyof typeof components
         if (!type) return { percentage: 0, attended: 0, conducted: 0 }
         
         const record = components[type]!
         const newAttended = record.totalAttended + added[type]
         const newConducted = record.totalConducted + added[type]
         const percentage = newConducted > 0 ? (newAttended / newConducted) * 100 : 0
         
         return { percentage, attended: newAttended, conducted: newConducted }
      }

      // Multiple component logic (LTPS)
      Object.entries(components).forEach(([type, record]) => {
        if (record) {
          const t = type as keyof typeof weights
          const weight = weights[t]
          const newAttended = record.totalAttended + added[t]
          const newConducted = record.totalConducted + added[t]
          const pct = newConducted > 0 ? (newAttended / newConducted) * 100 : 0
          
          totalWeight += weight
          weightedSum += pct * weight
          totalAttendedSum += newAttended
          totalConductedSum += newConducted
        }
      })
      
      const finalPercentage = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
      return { percentage: finalPercentage, attended: totalAttendedSum, conducted: totalConductedSum }
    }

    // Strategy 1: Single Component Solutions
    // For each available component type, check how many classes needed if ONLY that type is attended
    const types: (keyof typeof weights)[] = ['L', 'T', 'P', 'S']
    
    types.forEach(type => {
      if (subject.components[type]) {
        // Try increasing this component count until target reached (limit to reasonable number e.g. 50)
        for (let i = 1; i <= 50; i++) {
          const added = { L: 0, T: 0, P: 0, S: 0 }
          added[type] = i
          const { percentage, attended, conducted } = calculateProjection(added)
          if (percentage >= target) {
            options.push({ 
              ...added, 
              total: i, 
              projectedPercentage: percentage,
              projectedAttended: attended,
              projectedConducted: conducted
            })
            break
          }
        }
      }
    })

    // Strategy 2: BFS for Minimal Total Classes (Mixed)
    // Find the absolute minimum total classes needed (which might be a mix)
    // We only search if we haven't found very small single-component solutions (e.g. < 5)
    // or to see if a mix is better.
    
    // Optimization: If the min total from Strategy 1 is X, we only care about mixed solutions with total <= X
    const minSingleTotal = options.length > 0 ? Math.min(...options.map(o => o.total)) : 50
    
    // Use BFS to find optimal mixed solution
    const queue: { added: { L: number, T: number, P: number, S: number }, total: number }[] = [
      { added: { L: 0, T: 0, P: 0, S: 0 }, total: 0 }
    ]
    const visited = new Set<string>()
    visited.add("0,0,0,0")

    let foundOptimalMixed = false
    let optimalMixed: AttendanceOption | null = null

    // Limit BFS depth and iterations
    let iterations = 0
    while (queue.length > 0 && iterations < 2000) {
      const current = queue.shift()!
      iterations++

      if (current.total > minSingleTotal) continue // Prune paths longer than best single solution

      // Try adding 1 to each existing component
      for (const type of types) {
        if (subject.components[type]) {
          const nextAdded = { ...current.added, [type]: current.added[type] + 1 }
          const key = `${nextAdded.L},${nextAdded.T},${nextAdded.P},${nextAdded.S}`
          
          if (!visited.has(key)) {
            visited.add(key)
            const nextTotal = current.total + 1
            const { percentage, attended, conducted } = calculateProjection(nextAdded)
            
            if (percentage >= target) {
               // Found a solution
               if (!foundOptimalMixed || nextTotal < optimalMixed!.total) {
                 optimalMixed = { 
                   ...nextAdded, 
                   total: nextTotal, 
                   projectedPercentage: percentage,
                   projectedAttended: attended,
                   projectedConducted: conducted
                 }
                 foundOptimalMixed = true
               }
               // Don't continue this branch as we want minimal
            } else if (nextTotal < minSingleTotal) {
               queue.push({ added: nextAdded, total: nextTotal })
            }
          }
        }
      }
    }

    if (optimalMixed) {
      // Check if this mixed solution is already covered by single options
      const isDuplicate = options.some(o => 
        o.L === optimalMixed!.L && 
        o.T === optimalMixed!.T && 
        o.P === optimalMixed!.P && 
        o.S === optimalMixed!.S
      )
      
      if (!isDuplicate && optimalMixed.total <= minSingleTotal) {
        options.push(optimalMixed)
      }
    }

    // Sort options by total classes needed (ascending)
    return options.sort((a, b) => a.total - b.total)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Eligible': return 'text-green-500'
      case 'Conditional Eligibility': return 'text-yellow-500'
      default: return 'text-red-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Eligible': return <CheckCircle2 className="h-4 w-4" />
      case 'Conditional Eligibility': return <AlertCircle className="h-4 w-4" />
      default: return <XCircle className="h-4 w-4" />
    }
  }

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'Eligible': return 'shadow-[0_0_25px_-5px_rgba(34,197,94,0.4)] border-green-500/50 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)]'
      case 'Conditional Eligibility': return 'shadow-[0_0_25px_-5px_rgba(234,179,8,0.4)] border-yellow-500/50 hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.6)]'
      default: return 'shadow-[0_0_25px_-5px_rgba(239,68,68,0.4)] border-red-500/50 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.6)]'
    }
  }

  const saveResults = () => {
    if (!saveName.trim() || groupedSubjects.length === 0) return

    const newResult: SavedScreenshotResult = {
      id: Date.now().toString(),
      name: saveName.trim(),
      subjects: groupedSubjects,
      date: new Date().toLocaleDateString()
    }

    const updatedResults = [...savedResults, newResult]
    setSavedResults(updatedResults)
    Cookies.set('screenshotCalculatorDrafts', JSON.stringify(updatedResults), { expires: 365 })
    setSaveName('')
  }

  const loadSavedResult = (result: SavedScreenshotResult) => {
    setGroupedSubjects(result.subjects)
    setAttendanceData([])
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const deleteSavedResult = (id: string) => {
    const updatedResults = savedResults.filter(result => result.id !== id)
    setSavedResults(updatedResults)
    Cookies.set('screenshotCalculatorDrafts', JSON.stringify(updatedResults), { expires: 365 })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Screenshot Attendance Calculator',
    url: 'https://klattendance.vercel.app/screenshot',
    description: 'Upload your attendance screenshot to automatically calculate percentage and check eligibility using OCR.',
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Script
        id="screenshot-calc-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="relative inline-block mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold font-poppins">
            Screenshot Attendance Calculator
          </h1>
          <motion.div
            className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <p className="text-xl text-muted-foreground font-outfit max-w-3xl mx-auto">
          Upload a screenshot of your attendance report and get automated calculations with LTPS weighting
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="gradient-glow">
            <Card className="border-red-500/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-red-500" />
                  Upload Attendance Screenshot
                </CardTitle>
                <CardDescription>
                  Upload a clear screenshot of your attendance report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {!previewUrl && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <span className="text-base text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                  </div>
                </label>
              </div>
              )}

              {previewUrl && (
                <div className="space-y-6">
                  <div className="relative w-full h-64 border rounded-lg overflow-hidden group">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        setError(null)
                        setAttendanceData([])
                        setGroupedSubjects([])
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Process Image'
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Saved Results */}
          {savedResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Saved Results</CardTitle>
                  <CardDescription>
                    Previously calculated attendance reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {savedResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{result.name}</h3>
                            <p className="text-xs text-muted-foreground">{result.date}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSavedResult(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.subjects.length} subjects
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSavedResult(result)}
                          className="w-full"
                        >
                          Load Results
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>



        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-2"
        >
          {groupedSubjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Results</CardTitle>
                <CardDescription>
                  Subject-wise attendance with LTPS weighting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {groupedSubjects.map((subject, index) => (
                  <div key={index} className={`border rounded-lg p-6 space-y-4 transition-all duration-300 ${getStatusGlow(subject.status)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{subject.coursename}</h3>
                        <p className="text-base text-muted-foreground">{subject.coursecode}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getStatusColor(subject.status)}`}>
                          {subject.finalPercentage}%
                        </div>
                        <div className={`flex items-center gap-2 text-base ${getStatusColor(subject.status)}`}>
                          {getStatusIcon(subject.status)}
                          {subject.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(subject.components).map(([type, record]) => (
                        record && (
                          <div key={type} className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-sm font-medium">{type}</div>
                            <div className="text-base font-semibold">{record.percentage}%</div>
                            <div className="text-sm text-muted-foreground">
                              {record.totalAttended}/{record.totalConducted}
                            </div>
                          </div>
                        )
                      ))}
                    </div>

                    {/* Attendance Suggestions */}
                    {subject.status === 'Not Eligible' && subject.attendanceOptions && subject.attendanceOptions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                          To reach 75%, attend one of these options:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {subject.attendanceOptions.map((option, idx) => {
                            // Determine if this is a single component option to show component-specific projection
                            const activeTypes = (['L', 'T', 'P', 'S'] as const).filter(t => option[t] > 0)
                            const isSingle = activeTypes.length === 1
                            let projectionLabel = `(${option.projectedAttended}/${option.projectedConducted})`
                            
                            if (isSingle) {
                              const type = activeTypes[0]
                              const record = subject.components[type]
                              if (record) {
                                const newAtt = record.totalAttended + option[type]
                                const newCond = record.totalConducted + option[type]
                                projectionLabel = `(${newAtt}/${newCond})`
                              }
                            }

                            return (
                              <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                                {Object.entries(option)
                                  .filter(([key, val]) => key !== 'total' && key !== 'projectedPercentage' && key !== 'projectedAttended' && key !== 'projectedConducted' && val > 0)
                                  .map(([key, val]) => `${key}: ${val}`)
                                  .join(' + ')}
                                <span className="ml-2 text-xs text-muted-foreground">{projectionLabel}</span>
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {/* Skippable Classes Suggestions */}
                    {subject.skippableClasses && subject.skippableClasses.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          You can safely skip:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {subject.skippableClasses.map((option, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm py-1 px-3 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
                              {option.count} {option.component} class{option.count > 1 ? 'es' : ''} 
                              <span className="ml-1 text-xs text-muted-foreground">
                                (maintain &ge;{option.threshold}%)
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Save Results */}
                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Enter name to save results"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                  <Button onClick={saveResults} disabled={!saveName.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>


      </div>


    </div>
  )
}

