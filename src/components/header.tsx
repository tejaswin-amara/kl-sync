"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Simple Calculator', href: '/simple' },
    { name: 'LTPS Calculator', href: '/ltps' },
    { name: 'Screenshot Calculator', href: '/screenshot' },
    { name: 'ERP Login', href: '/login' },
  ]

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 px-2 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-md py-2" : "bg-transparent py-3"
      }`}
    >
      <div className="container mx-auto px-2 sm:px-4 flex justify-between items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="relative flex items-center">
              <Image
                src="/KL_University_logo.svg"
                alt="KL Logo"
                width={42}
                height={42}
                className="h-9 sm:h-11 w-auto"
                priority
              />
            </div>
          </Link>
        </motion.div>

        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <nav>
            <ul className="flex gap-4 lg:gap-6">
              {navigationItems.map((item, index) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    prefetch={false}
                    className="text-foreground/80 hover:text-red-500 transition-colors relative group font-outfit"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
          <ModeToggle />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background/95 backdrop-blur-md"
          >
            <nav className="container mx-auto px-4 py-3">
              <ul className="flex flex-col gap-3">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="text-foreground/80 hover:text-red-500 transition-colors block py-2 font-outfit"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
