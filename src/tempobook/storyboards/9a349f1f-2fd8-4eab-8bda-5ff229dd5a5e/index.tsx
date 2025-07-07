import ReleasesManager from "@/components/music/ReleasesManager";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function FixedReleasesManagerStoryboard() {
  return (
    <div className="bg-background min-h-screen">
      <AuthProvider>
        <ReleasesManager />
      </AuthProvider>
    </div>
  );
}
