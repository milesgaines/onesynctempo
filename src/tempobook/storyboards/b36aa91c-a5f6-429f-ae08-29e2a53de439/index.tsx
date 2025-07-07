import MusicUploader from "@/components/upload/MusicUploader";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function WorkingMusicUploaderStoryboard() {
  const handleComplete = (data) => {
    console.log("Upload completed:", data);
  };

  return (
    <AuthProvider>
      <div className="bg-background p-6 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Fixed Music Upload Form
          </h1>
          <MusicUploader onComplete={handleComplete} />
        </div>
      </div>
    </AuthProvider>
  );
}
