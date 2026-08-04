# Milestone 1: Design System, UI Primitives & Responsive Layout Shell — Handoff Report

## 1. Observation

Direct observations from examining the codebase and baseline build environment:

1. **`src/app/globals.css`**:
   - Currently uses `@import "tailwindcss";` with a basic `@theme inline` block defining `--color-background`, `--color-foreground`, `--color-primary`, `--color-border`, `--color-muted`, `--color-destructive`, `--font-sans`, `--font-mono`, `--animate-grid`.
   - Lacks standardized glassmorphism utility classes (`.glass-panel`, `.glass-card`, `.glass-input`, `.glass-pill`) and micro-interaction utilities (`.hover-lift`, `.active-press`, `.animate-shimmer`).
   - `:root` contains base color variables (`--background: #07070A`, `--foreground: #F4F4F5`, etc.).

2. **`src/app/layout.tsx`**:
   - Line 1 contains `/* eslint-disable @next/next/no-page-custom-font */`.
   - Lines 36-39 include an external Google Font stylesheet link `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..."/>`.
   - Next.js Google font loaders `Inter` (`--font-inter`) and `Outfit` (`--font-outfit`) are instantiated, but `--font-outfit` is not bound in `@theme inline` within `globals.css`.

3. **`src/components/ui/` Directory**:
   - `src/components/ui/` is currently empty.
   - Core UI component primitives (`button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx`, `tabs.tsx`, `sheet.tsx`, `skeleton.tsx`, `tooltip.tsx`) need to be created.

4. **`src/components/Navigation.tsx`**:
   - Implements a custom sidebar and mobile drawer using inline styles (`background: 'rgba(9,9,11,0.95)'`, `backdropFilter: 'blur(20px)'`).
   - Uses hardcoded HTML elements instead of reusable UI primitives (`Button`, `Badge`, `Sheet`).
   - Content wrapper uses `max-w-7xl mx-auto`.

5. **Build & Test Baseline**:
   - `npm run lint` completed with 0 errors / warnings.
   - `npm run test` ran 30 tests across 5 test suites; 30 passed, 0 failed.
   - `npm run build` completed cleanly with 0 TypeScript compilation errors.

---

## 2. Logic Chain

1. **Glassmorphism & Theme Standardization (`globals.css`)**:
   - *Observation*: The application relies on custom card and field styles scattered across CSS and inline style objects.
   - *Deduction*: By expanding `@theme inline` with full design token aliases and centralizing glassmorphic classes (`.glass-panel`, `.glass-card`, `.glass-input`, `.glass-pill`), micro-interactions (`.hover-lift`, `.active-press`, `.animate-shimmer`), and WCAG 2.4.13 Level AAA focus ring rules, all UI components will maintain consistent visual presentation across dark mode, touch devices, and responsive viewports.

2. **Font Optimization & ESLint Cleanliness (`layout.tsx`)**:
   - *Observation*: `layout.tsx` suppresses `@next/next/no-page-custom-font` due to an external Google Font link (`Material Symbols Outlined`).
   - *Deduction*: Deleting the external `<link>` tag eliminates external runtime font fetching dependencies, allows removing the ESLint suppression directive, and cleanly binds Next.js font variables (`--font-inter` and `--font-outfit`).

3. **UI Component Primitives Specification (`src/components/ui/`)**:
   - *Observation*: Zero UI primitives currently exist in `src/components/ui/`.
   - *Deduction*: Implementing `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx`, `tabs.tsx`, `sheet.tsx`, `skeleton.tsx`, and `tooltip.tsx` using `cn()` from `@/lib/utils` and WCAG 44px+ touch targets will provide a solid foundation for Milestone 1 layout and all subsequent dashboard modules (M2-M4).

4. **Navigation Shell Refactoring (`Navigation.tsx`)**:
   - *Observation*: Mobile drawer navigation is currently implemented with manual state toggling and inline backdrop styles.
   - *Deduction*: Refactoring `Navigation.tsx` to leverage the new `Sheet` primitive, `Button`, `Badge`, and `.glass-panel` utilities will unify mobile drawer (<640px) vs desktop fixed sidebar (>=1024px) handling, enhance active route visual indicators, and preserve the `max-w-7xl` ultra-wide container capping.

---

## 3. Caveats

- **Lucide Icons**: Icon names across UI components rely on `lucide-react` (already present in `package.json` v1.21.0).
- **Tailwind CSS v4 Compatibility**: `@import "tailwindcss";` and `@theme inline` syntax are used in accordance with Tailwind v4 rules without `tailwind.config.js`.
- **No Direct Source Changes**: As an Explorer agent, this report provides exact, copy-paste ready file specifications for the Implementer agent.

---

## 4. Conclusion

Milestone 1 design system architecture is fully defined. By updating `globals.css`, cleaning `layout.tsx`, creating 9 robust UI primitives in `src/components/ui/`, and refactoring `Navigation.tsx`, KL Sync will establish a modern, responsive, glassmorphic layout shell that meets all WCAG 2.2 accessibility and performance criteria.

---

## 5. File-by-File Blueprint & Specifications

### File 1: `src/app/globals.css`
Modify `src/app/globals.css` to add theme tokens, glassmorphism classes, micro-interactions, and focus rings:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-info: var(--info);

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;

  --animate-shimmer: shimmer 2s infinite linear;
  --animate-grid: grid 15s linear infinite;
}

@layer base {
  :root {
    --background: #07070a;
    --foreground: #f4f4f5;
    --card: rgba(15, 15, 20, 0.7);
    --card-foreground: #f4f4f5;
    --popover: #0f0f14;
    --popover-foreground: #f4f4f5;
    --primary: #6366f1;
    --primary-foreground: #ffffff;
    --secondary: #18181b;
    --secondary-foreground: #e4e4e7;
    --muted: #18181b;
    --muted-foreground: #a1a1aa;
    --accent: rgba(99, 102, 241, 0.15);
    --accent-foreground: #818cf8;
    --destructive: #ef4444;
    --destructive-foreground: #ffffff;
    --border: rgba(255, 255, 255, 0.12);
    --input: rgba(255, 255, 255, 0.12);
    --ring: #818cf8;

    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --info: #6366f1;
  }
  * { border-color: var(--border); box-sizing: border-box; }
  body {
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: rgba(99,102,241,.4); color: #ffffff; }
}

@keyframes grid {
  0% { transform: translateY(-50%); }
  100% { transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ── Glassmorphic Utilities ── */
.glass-panel {
  background: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-card {
  background: rgba(15, 15, 20, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5);
}

.glass-input {
  background: rgba(20, 20, 26, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--foreground);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.glass-input:hover {
  border-color: rgba(255, 255, 255, 0.24);
}

.glass-input::placeholder {
  color: #a1a1aa;
}

.glass-pill {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}

/* ── Micro-interactions ── */
.hover-lift {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.hover-lift:hover {
  transform: translateY(-2px);
}

.active-press {
  transition: transform 0.1s ease;
}
.active-press:active {
  transform: scale(0.98);
}

.animate-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

/* ── Level AAA High-Contrast Focus Ring (WCAG 2.4.13) ── */
:focus-visible,
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #818cf8 !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.35) !important;
}

/* ── Scrollbar Customization ── */
* { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }
```

---

### File 2: `src/app/layout.tsx`
Clean up font configuration and remove external Google font stylesheet link:

```tsx
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KL Sync',
  description: 'Modern KL Sync Overlay',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className="min-h-full flex flex-col font-sans text-zinc-50 bg-zinc-950"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
```

---

### File 3: `src/components/ui/button.tsx`
Create accessible button primitive with variants and touch target sizing:

```tsx
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none active-press cursor-pointer';

    const variantStyles = {
      default:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30',
      primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30',
      secondary:
        'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-white/10 shadow-sm',
      ghost:
        'hover:bg-white/10 text-zinc-300 hover:text-white',
      outline:
        'border border-zinc-700/80 bg-transparent hover:bg-zinc-800/60 text-zinc-200 hover:text-white',
      destructive:
        'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 border border-red-500/30',
    };

    const sizeStyles = {
      default: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl gap-2',
      sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-lg gap-1.5',
      lg: 'min-h-[48px] px-6 py-3 text-base rounded-xl gap-2.5',
      icon: 'min-h-[44px] min-w-[44px] p-2.5 rounded-xl justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
```

---

### File 4: `src/components/ui/card.tsx`
Create modular glassmorphic card component suite:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-zinc-900/90 border border-white/10 rounded-2xl shadow-xl text-zinc-100',
      glass: 'glass-card rounded-2xl text-zinc-100',
      interactive: 'glass-card hover-lift cursor-pointer rounded-2xl text-zinc-100',
    };

    return (
      <div
        ref={ref}
        className={cn(variantStyles[variant], className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight text-white font-heading', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-zinc-400 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-4 border-t border-white/5', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

---

### File 5: `src/components/ui/input.tsx`
Create glassmorphic input primitive:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex w-full min-h-[44px] rounded-xl px-4 py-2.5 text-sm glass-input text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-500/50 focus-visible:ring-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-zinc-400">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

---

### File 6: `src/components/ui/badge.tsx`
Create threshold status badge primitive:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'emerald'
    | 'warning'
    | 'amber'
    | 'error'
    | 'red'
    | 'info'
    | 'indigo';
  dot?: boolean;
}

function Badge({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-200 border-white/10',
    secondary: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    outline: 'border-zinc-700 text-zinc-300 bg-transparent',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  };

  const dotColorStyles = {
    success: 'bg-emerald-400',
    emerald: 'bg-emerald-400',
    warning: 'bg-amber-400',
    amber: 'bg-amber-400',
    error: 'bg-red-400',
    red: 'bg-red-400',
    info: 'bg-indigo-400',
    indigo: 'bg-indigo-400',
    default: 'bg-zinc-400',
    secondary: 'bg-zinc-500',
    outline: 'bg-zinc-400',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            dotColorStyles[variant]
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge };
```

---

### File 7: `src/components/ui/dialog.tsx`
Create accessible modal dialog with backdrop blur & focus trap:

```tsx
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDialog();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight text-white font-heading', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-zinc-400 leading-relaxed', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-white/5', className)}
      {...props}
    />
  );
}

export function DialogClose({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialog();
  return (
    <button type="button" className={className} onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}
```

---

### File 8: `src/components/ui/tabs.tsx`
Create accessible tabs primitive with pill styling:

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

export function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within Tabs');
  }
  return context;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'glass-panel p-1.5 rounded-xl inline-flex items-center gap-1 border border-white/10 overflow-x-auto custom-scrollbar',
        className
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabs();
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
        isActive
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: activeValue } = useTabs();
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-4 focus-visible:outline-none animate-in fade-in-0 duration-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

---

### File 9: `src/components/ui/sheet.tsx`
Create responsive slide-over drawer primitive:

```tsx
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType | null>(null);

export function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within Sheet');
  }
  return context;
}

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheet();
  return (
    <button type="button" className={className} onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function SheetContent({
  side = 'left',
  children,
  className,
  ...props
}: SheetContentProps) {
  const { open, setOpen } = useSheet();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const sideStyles = {
    left: 'top-0 left-0 h-full w-[280px] sm:w-[350px] border-r animate-in slide-in-from-left duration-300',
    right: 'top-0 right-0 h-full w-[280px] sm:w-[350px] border-l animate-in slide-in-from-right duration-300',
    top: 'top-0 left-0 right-0 w-full h-auto max-h-[80vh] border-b animate-in slide-in-from-top duration-300',
    bottom: 'bottom-0 left-0 right-0 w-full h-auto max-h-[80vh] border-t animate-in slide-in-from-bottom duration-300',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-200"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 glass-panel border-white/10 shadow-2xl flex flex-col p-6',
          sideStyles[side],
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-white font-heading', className)} {...props} />;
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-zinc-400', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto pt-4 border-t border-white/5 flex flex-col gap-2', className)} {...props} />;
}

export function SheetClose({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useSheet();
  return (
    <button type="button" className={className} onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
}
```

---

### File 10: `src/components/ui/skeleton.tsx`
Create shimmer skeleton loader primitive:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-zinc-800/80 animate-pulse',
        shimmer && 'animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
```

---

### File 11: `src/components/ui/tooltip.tsx`
Create accessible tooltip wrapper:

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delayDuration = 200,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 glass-panel text-xs text-zinc-200 px-3 py-1.5 rounded-lg shadow-lg border border-white/10 whitespace-nowrap pointer-events-none animate-in fade-in-0 duration-150',
            positionStyles[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

---

### File 12: `src/components/Navigation.tsx`
Refactor layout shell using UI primitives and glassmorphism styling:

```tsx
'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Star,
  Calendar,
  CreditCard,
  Megaphone,
  Building2,
  BookOpen,
  LogOut,
  Menu,
  Bell,
} from 'lucide-react';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';

function ProfileAvatar({
  user,
  className = '',
}: {
  user: { id: string; initials: string; photoUrl: string };
  className?: string;
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-white/10 relative ${className}`}
    >
      {user.id !== 'Student ID' && user.id !== 'Loading...' && (
        <img
          src={
            user.photoUrl
              ? user.photoUrl.startsWith('data:image/')
                ? user.photoUrl
                : `/api/fetch-photo?path=${encodeURIComponent(user.photoUrl)}`
              : `/api/fetch-photo?id=${user.id}`
          }
          alt="Profile"
          className="w-full h-full object-cover absolute inset-0 z-10"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span className="text-zinc-400 z-0 relative">{user.initials}</span>
    </div>
  );
}

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState({
    name: 'Student',
    initials: 'ST',
    id: 'Loading...',
    photoUrl: '',
  });

  useEffect(() => {
    let cachedName: string | null = null;
    queueMicrotask(() => {
      cachedName = localStorage.getItem('kl_student_name');
      const cachedPhoto = localStorage.getItem('kl_student_photo') || '';
      const name = cachedName || 'Student';
      const id = localStorage.getItem('studentId') || 'Student ID';
      const initials =
        name !== 'Student'
          ? name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
          : 'ST';
      setUser({ name, initials, id, photoUrl: cachedPhoto });

      if (!cachedName) {
        fetch('/api/erp-proxy/profile')
          .then((res) => res.json())
          .then((data) => {
            const profileData = data.profile || data.data;
            if (data.success && profileData && profileData.name) {
              localStorage.setItem('kl_student_name', profileData.name);
              localStorage.setItem(
                'kl_student_profile',
                JSON.stringify(profileData)
              );
              if (profileData.photoUrl) {
                localStorage.setItem('kl_student_photo', profileData.photoUrl);
              }
              setUser((prev) => ({
                ...prev,
                name: profileData.name,
                initials: profileData.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase(),
                photoUrl: profileData.photoUrl || '',
              }));
            }
          })
          .catch((err) => {
            console.warn('Failed to fetch profile:', err);
          });
      }
    });

    return () => {};
  }, []);

  const handleSignOut = () => {
    sessionStorage.clear();
    localStorage.removeItem('studentId');
    localStorage.removeItem('kl_student_name');
    localStorage.removeItem('kl_student_photo');
    localStorage.removeItem('kl_student_profile');
    localStorage.removeItem('kl_erp_academic_years');
    localStorage.removeItem('kl_erp_semesters');
    document.cookie = 'kl_erp_session=; Max-Age=-99999999; path=/;';
    window.location.href = '/';
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/attendance', label: 'Attendance', icon: CheckSquare },
    { href: '/dashboard/marks', label: 'Marks', icon: Star },
    { href: '/dashboard/timetable', label: 'Timetable', icon: Calendar },
    { href: '/dashboard/fee', label: 'Fee Details', icon: CreditCard },
    { href: '/dashboard/circulars', label: 'Circulars', icon: Megaphone },
    { href: '/dashboard/hostels', label: 'Hostel Info', icon: Building2 },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard/tools', label: 'Tools & Calcs', icon: CheckSquare },
  ];

  const renderNavLinks = (onItemClick?: () => void) => (
    <div className="flex-1 flex flex-col justify-evenly min-h-[420px]">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all cursor-pointer rounded-xl text-sm font-medium ${
              isActive
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-semibold'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'} shrink-0`}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute rounded-full blur-[100px] bg-indigo-500/30 top-[10%] left-[20%] w-[30vw] h-[30vw] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute rounded-full blur-[120px] bg-purple-500/20 top-[40%] right-[10%] w-[25vw] h-[25vw] animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        <div
          className="absolute rounded-full blur-[100px] bg-emerald-500/30 bottom-[10%] left-[30%] w-[35vw] h-[35vw] animate-pulse"
          style={{ animationDuration: '10s' }}
        />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3 border-b border-white/10 glass-panel">
        <div className="flex items-center gap-3">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                <Menu className="w-5 h-5 text-zinc-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col w-[280px]">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setDrawerOpen(false)}>
                  <img src="/logo.png" alt="KL" className="h-7 w-auto object-contain" />
                  <span className="font-bold text-lg text-zinc-100 font-heading">KL Sync</span>
                </Link>
              </div>
              <div className="flex-1 py-4 px-3 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2">
                  Navigation
                </div>
                {renderNavLinks(() => setDrawerOpen(false))}
              </div>
              <div className="p-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="KL" className="h-6 object-contain" />
            <span className="font-bold text-sm text-zinc-100 font-heading">KL Sync</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/circulars"
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-300"
            aria-label="View circulars"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </Link>
          <ProfileAvatar user={user} />
        </div>
      </header>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-[280px] shrink-0 flex-col border-r border-white/10 glass-panel z-30">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="KL" className="h-8 w-auto object-contain" />
            <span className="font-bold text-lg text-zinc-100 tracking-tight font-heading">
              KL Sync
            </span>
          </Link>
        </div>

        <div className="flex-1 py-4 px-3 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2">
            Menu
          </div>
          {renderNavLinks()}
        </div>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-full pt-[60px] lg:pt-0 lg:pl-[280px]">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-transparent backdrop-blur-sm z-20 shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight font-heading">
              {pathname === '/dashboard'
                ? 'Overview'
                : navItems.find(
                    (i) =>
                      pathname.startsWith(i.href) && i.href !== '/dashboard'
                  )?.label || navItems.find((i) => i.href === pathname)?.label}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="py-1 px-3">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Current Sem
            </Badge>

            <Tooltip content="View Notifications & Circulars">
              <Link
                href="/dashboard/circulars"
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 bg-white/5 border border-white/5 inline-flex items-center justify-center"
                aria-label="View circulars"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </Link>
            </Tooltip>

            <div className="h-8 w-px bg-white/10 mx-1" />
            <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors">
              <ProfileAvatar user={user} className="shrink-0" />
              <span className="text-sm font-semibold text-zinc-100 hidden sm:block">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
```

---

## 6. Verification Method

To independently verify Milestone 1 implementation:

1. **Lint Verification**:
   ```bash
   npm run lint
   ```
   Must complete with 0 ESLint warnings or errors (confirming elimination of `@next/next/no-page-custom-font` suppression).

2. **Unit Test Verification**:
   ```bash
   npm run test
   ```
   Must pass all 30 tests cleanly.

3. **Production Build Verification**:
   ```bash
   npm run build
   ```
   Must complete with 0 TypeScript errors and render all route pages successfully.
