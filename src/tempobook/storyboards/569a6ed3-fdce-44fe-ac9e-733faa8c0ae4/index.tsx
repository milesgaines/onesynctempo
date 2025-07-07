import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import AuthWrapper from "../auth-provider-wrapper";

export default function AnalyticsChartsStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background p-6">
          <h1 className="text-2xl font-bold mb-6">Analytics Charts</h1>
          <AnalyticsCharts
            data={{
              plays: {
                labels: [],
                values: [],
              },
              revenue: {
                labels: [],
                values: [],
              },
              geography: {
                countries: [],
                values: [],
              },
              platforms: {
                names: [],
                values: [],
              },
            }}
          />
        </div>
      )}
    </AuthWrapper>
  );
}
