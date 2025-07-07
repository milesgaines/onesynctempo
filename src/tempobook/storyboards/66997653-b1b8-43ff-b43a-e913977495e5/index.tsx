import MusicUploader from "@/components/upload/MusicUploader";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function MusicUploaderStoryboard() {
  return (
    <AuthProvider>
      <div className="bg-background p-6">
        <MusicUploader />
      </div>
    </AuthProvider>
  );
}
