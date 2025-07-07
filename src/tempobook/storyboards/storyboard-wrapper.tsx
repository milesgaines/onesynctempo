import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";

interface StoryboardWrapperProps {
  children: ReactNode;
}

export default function StoryboardWrapper({
  children,
}: StoryboardWrapperProps) {
  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </div>
  );
}
