'use client';

import { AIChatSheet, AIChatSheetProps } from './AIChatSheet';

export type AIChatDialogProps = Omit<AIChatSheetProps, 'onToggleDialogMode'> & {
  onToggleSheetMode?: () => void;
};

export function AIChatDialog({
  onToggleSheetMode,
  ...props
}: AIChatDialogProps) {
  return (
    <AIChatSheet
      {...props}
      onToggleDialogMode={onToggleSheetMode}
    />
  );
}
