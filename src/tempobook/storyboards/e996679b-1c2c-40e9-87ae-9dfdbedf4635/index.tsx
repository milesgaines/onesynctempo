import NotificationCenter from "@/components/notifications/NotificationCenter";
import AuthWrapper from "../auth-provider-wrapper";

export default function NotificationCenterStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-white p-4">
          <NotificationCenter />
        </div>
      )}
    </AuthWrapper>
  );
}
