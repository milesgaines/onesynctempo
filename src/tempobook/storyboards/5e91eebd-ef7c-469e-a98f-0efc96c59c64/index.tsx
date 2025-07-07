import ReleasesManager from "@/components/music/ReleasesManager";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function ReleasesManagerStoryboard() {
  return (
    <AuthProvider>
      <div className="bg-background min-h-screen">
        <ReleasesManager />
      </div>
    </AuthProvider>
  );
}
