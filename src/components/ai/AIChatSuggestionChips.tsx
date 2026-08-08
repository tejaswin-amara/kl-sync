'use client';

import { Calendar, DollarSign, Award, Target, BookOpen } from 'lucide-react';

interface SuggestionChip {
  label: string;
  query: string;
  icon: React.ReactNode;
}

const SUGGESTIONS: SuggestionChip[] = [
  {
    label: 'OS Attendance',
    query: 'What is my attendance in OS?',
    icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" />,
  },
  {
    label: 'Fee Balance',
    query: 'Show fee breakdown',
    icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    label: 'Today Schedule',
    query: 'What classes do I have today?',
    icon: <Calendar className="w-3.5 h-3.5 text-purple-400" />,
  },
  {
    label: 'Target 75%',
    query: 'How many classes can I miss in OS?',
    icon: <Target className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    label: 'Predict CGPA',
    query: 'Predict CGPA with upcoming courses',
    icon: <Award className="w-3.5 h-3.5 text-pink-400" />,
  },
];

interface AIChatSuggestionChipsProps {
  onSelectSuggestion: (query: string) => void;
  disabled?: boolean;
}

export function AIChatSuggestionChips({
  onSelectSuggestion,
  disabled = false,
}: AIChatSuggestionChipsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
      <div className="flex items-center gap-1.5 shrink-0 px-0.5">
        {SUGGESTIONS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSuggestion(chip.query)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-secondary/60 hover:bg-secondary text-secondary-foreground border border-border/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0 min-h-[44px]"
          >
            {chip.icon}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
