import SupabaseConnectionTest from "@/components/utils/SupabaseConnectionTest";
import AuthWrapper from "../auth-provider-wrapper";

export default function SupabaseConnectionTestStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background min-h-screen p-4">
          <SupabaseConnectionTest />
        </div>
      )}
    </AuthWrapper>
  );
}
