import MusicUploader from "@/components/upload/MusicUploader";
import { Card } from "@/components/ui/card";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function FixedMusicUploaderStoryboard() {
  return (
    <AuthProvider>
      <div className="bg-background min-h-screen p-4">
        <Card className="w-full max-w-4xl mx-auto">
          <MusicUploader
            onComplete={(data) => {
              console.log("Upload completed with data:", data);
            }}
          />
        </Card>
      </div>
    </AuthProvider>
  );
}
