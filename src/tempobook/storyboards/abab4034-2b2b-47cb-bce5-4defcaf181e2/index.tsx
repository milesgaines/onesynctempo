import DashboardOverview from "@/components/dashboard/DashboardOverview";
import AuthWrapper from "../auth-provider-wrapper";

export default function FixedDashboardStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background min-h-screen p-4">
          <DashboardOverview />
        </div>
      )}
    </AuthWrapper>
  );
}
