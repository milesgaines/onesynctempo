import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

interface AuthWrapperProps {
  children: ReactNode | ((authProps: any) => ReactNode);
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <AuthProvider>
      {typeof children === "function" ? children({}) : children}
    </AuthProvider>
  );
}
