import ProfileSettings from "@/components/settings/ProfileSettings";
import AuthWrapper from "../auth-provider-wrapper";

export default function ProfileSettingsStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-white p-6">
          <ProfileSettings />
        </div>
      )}
    </AuthWrapper>
  );
}
