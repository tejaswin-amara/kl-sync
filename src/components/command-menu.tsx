"use client"

import * as React from "react"
import { Command } from "cmdk"
import { Search, Calendar, User, LayoutDashboard, LogOut } from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      
      <div className="relative w-full max-w-lg rounded-xl border border-white/20 bg-black shadow-2xl overflow-hidden text-white mx-4">
        <Command label="Global Command Menu" className="w-full">
          <div className="flex items-center border-b border-white/10 px-3">
            <Search className="w-4 h-4 text-white/50 mr-2" />
            <Command.Input 
              autoFocus
              className="w-full bg-transparent py-4 outline-none placeholder:text-white/50 text-white" 
              placeholder="Type a command or search..." 
            />
            <div className="text-xs text-white/30 border border-white/10 rounded px-1.5 py-0.5">ESC</div>
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-white/50">
              No results found.
            </Command.Empty>
            
            <Command.Group heading="Navigation" className="text-xs text-white/40 font-medium px-2 py-1">
              <Command.Item 
                onSelect={() => { window.location.href = '/'; setOpen(false); }}
                className="flex items-center px-2 py-2.5 mt-1 rounded-md text-sm text-white cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Command.Item>
              <Command.Item 
                onSelect={() => { window.location.href = '/timetable'; setOpen(false); }}
                className="flex items-center px-2 py-2.5 rounded-md text-sm text-white cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Timetable
              </Command.Item>
              <Command.Item 
                onSelect={() => { window.location.href = '/profile'; setOpen(false); }}
                className="flex items-center px-2 py-2.5 rounded-md text-sm text-white cursor-pointer hover:bg-white/10 data-[selected=true]:bg-white/10"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Settings" className="text-xs text-white/40 font-medium px-2 py-1 mt-2">
              <Command.Item 
                onSelect={() => { window.location.href = '/login'; setOpen(false); }}
                className="flex items-center px-2 py-2.5 mt-1 rounded-md text-sm text-red-400 cursor-pointer hover:bg-red-400/10 data-[selected=true]:bg-red-400/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
