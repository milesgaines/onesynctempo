import ArtistManager from "@/components/artists/ArtistManager";
import AuthWrapper from "../auth-provider-wrapper";

export default function ArtistManagerStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background min-h-screen p-4">
          <ArtistManager />
        </div>
      )}
    </AuthWrapper>
  );
}
