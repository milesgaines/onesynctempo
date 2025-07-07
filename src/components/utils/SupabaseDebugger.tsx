import React from 'react';

interface SupabaseDebuggerProps {
  onComplete?: () => void;
}

export default function SupabaseDebugger({ onComplete }: SupabaseDebuggerProps) {
  return (
    <div onClick={() => onComplete?.()}>SupabaseDebugger placeholder</div>
  );
}
