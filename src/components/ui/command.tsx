'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CommandContextType {
  search: string;
  setSearch: (value: string) => void;
}

const CommandContext = React.createContext<CommandContextType | undefined>(undefined);

function useCommandContext() {
  const context = React.useContext(CommandContext);
  if (!context) {
    throw new Error('Command subcomponents must be used within a Command');
  }
  return context;
}

export function Command({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [search, setSearch] = React.useState('');

  return (
    <CommandContext.Provider value={{ search, setSearch }}>
      <div
        className={cn(
          'flex h-full w-full flex-col overflow-hidden rounded-xl bg-surface-2 text-foreground border border-border shadow-xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CommandContext.Provider>
  );
}

export function CommandDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-lg border-0 bg-transparent shadow-2xl">
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

export const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, value, onChange, ...props }, ref) => {
  const { search, setSearch } = useCommandContext();

  return (
    <div className="flex items-center border-b border-border px-3" com-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
      <input
        ref={ref}
        value={value ?? search}
        onChange={(e) => {
          onChange?.(e);
          setSearch(e.target.value);
        }}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]',
          className
        )}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = 'CommandInput';

export function CommandList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden p-1', className)} {...props}>
      {children}
    </div>
  );
}

export function CommandEmpty({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { search } = useCommandContext();
  if (!search) return null;

  return (
    <div className={cn('py-6 text-center text-sm text-muted-foreground', className)} {...props}>
      {children || 'No results found.'}
    </div>
  );
}

export function CommandGroup({
  heading,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode }) {
  return (
    <div
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[com-group-heading]]:px-2 [&_[com-group-heading]]:py-1.5 [&_[com-group-heading]]:text-xs [&_[com-group-heading]]:font-semibold [&_[com-group-heading]]:text-muted-foreground',
        className
      )}
      {...props}
    >
      {heading && <div com-group-heading="">{heading}</div>}
      {children}
    </div>
  );
}

export const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean; onSelect?: () => void }
>(({ className, disabled, onSelect, onClick, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="option"
      aria-selected="false"
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        onSelect?.();
      }}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-sm outline-hidden hover:bg-surface-3 hover:text-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 min-h-[44px] transition-colors',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
CommandItem.displayName = 'CommandItem';

export function CommandSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}

export function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground font-mono', className)}
      {...props}
    />
  );
}
