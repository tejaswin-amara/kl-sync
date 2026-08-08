'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AIChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Ask AI Copilot about attendance, timetable, marks, fees...',
}: AIChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-3 bg-card/60 backdrop-blur-md border border-border rounded-xl shadow-lg">
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent border-0 focus:outline-hidden text-sm text-foreground placeholder:text-muted-foreground max-h-[120px] py-1.5 px-2"
          aria-label="Ask AI Copilot"
        />
      </div>
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all"
        aria-label="Send query"
      >
        {disabled ? (
          <Sparkles className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
