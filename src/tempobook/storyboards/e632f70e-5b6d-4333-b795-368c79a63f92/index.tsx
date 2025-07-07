import ProfileSettings from "@/components/settings/ProfileSettings";
import AuthWrapper from "../auth-provider-wrapper";

export default function ProfileAvatarUploadStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background min-h-screen p-6">
          <ProfileSettings />
        </div>
      )}
    </AuthWrapper>
  );
}
