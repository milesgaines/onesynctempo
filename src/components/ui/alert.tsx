import React, { ReactNode } from 'react';

interface AlertProps {
  variant?: string;
  children?: ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  return <div data-variant={variant}>{children}</div>;
}

export function AlertDescription({ children }: { children: ReactNode }) {
  return <div className="alert-description">{children}</div>;
}
