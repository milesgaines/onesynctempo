import React, { ReactNode } from 'react';

export function Tabs({ children }: { children: ReactNode; defaultValue?: string }) {
  return <div className="tabs">{children}</div>;
}

export function TabsList({ children }: { children: ReactNode }) {
  return <div className="tabs-list">{children}</div>;
}

export function TabsTrigger({ children }: { children: ReactNode; value?: string }) {
  return <button className="tabs-trigger">{children}</button>;
}

export function TabsContent({ children }: { children: ReactNode; value?: string }) {
  return <div className="tabs-content">{children}</div>;
}
