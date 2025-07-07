import React from 'react';

interface OnboardingModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  return (
    <div>
      OnboardingModal placeholder - {open ? 'open' : 'closed'}
    </div>
  );
}
