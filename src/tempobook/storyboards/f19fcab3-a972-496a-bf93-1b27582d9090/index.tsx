import DashboardOverview from "@/components/dashboard/DashboardOverview";
import React from "react";
import AuthWrapper from "../auth-provider-wrapper";

export default function DashboardOverviewStoryboard() {
  return (
    <AuthWrapper>
      <div className="bg-background">
        <DashboardOverview />
      </div>
    </AuthWrapper>
  );
}
