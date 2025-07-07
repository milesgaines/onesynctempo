import OnboardingModal from "@/components/onboarding/OnboardingModal";
import AuthWrapper from "../auth-provider-wrapper";

export default function OnboardingModalStoryboard() {
  return (
    <AuthWrapper>
      {() => (
        <div className="bg-background min-h-screen p-4">
          <OnboardingModal
            open={true}
            onOpenChange={(open) => {
              console.log("Onboarding modal state changed:", open);
            }}
          />
        </div>
      )}
    </AuthWrapper>
  );
}
