import MusicUploader from "@/components/upload/MusicUploader";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function UpdatedMusicUploaderStoryboard() {
  return (
    <AuthProvider>
      <div className="bg-background p-4">
        <MusicUploader />
      </div>
    </AuthProvider>
  );
}
