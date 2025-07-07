import EarningsManager from "@/components/earnings/EarningsManager";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function EarningsManagerStoryboard() {
  return (
    <AuthProvider>
      <div className="bg-background">
        <EarningsManager />
      </div>
    </AuthProvider>
  );
}
