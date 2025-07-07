import { Suspense, useEffect, useState } from "react";
import { useRoutes, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./components/home";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import MusicUploader from "./components/upload/MusicUploader";
import EarningsManager from "./components/earnings/EarningsManager";

// Re-import to ensure proper module loading
import LoginForm from "./components/auth/LoginForm";
import AuthCallback from "./components/auth/callback";
import SpotifyCallback from "./components/auth/SpotifyCallback";
import NotFound from "./components/NotFound";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";

// Import tempo routes dynamically
const getTempoRoutes = async () => {
  console.log(
    "🛣️ [APP] Loading tempo routes, VITE_TEMPO:",
    import.meta.env.VITE_TEMPO,
  );
  if (import.meta.env.VITE_TEMPO === "true") {
    try {
      console.log("📥 [APP] Importing tempo-routes...");
      const tempoRoutes = await import("tempo-routes");
      console.log(
        "✅ [APP] Tempo routes loaded:",
        tempoRoutes.default?.length || 0,
        "routes",
      );
      return tempoRoutes.default || [];
    } catch (error) {
      console.warn("⚠️ [APP] Tempo routes not available:", error);
      return [];
    }
  }
  console.log("⏭️ [APP] Tempo disabled, skipping routes");
  return [];
};

function AppContent() {
  const { user, loading, userProfile } = useAuth();
  const [tempoRoutes, setTempoRoutes] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const location = useLocation();

  console.log(
    "🏠 [APP] AppContent render - User:",
    user ? "✅ Authenticated" : "❌ Not authenticated",
    "Loading:",
    loading,
    "Profile:",
    userProfile ? "✅ Loaded" : "❌ Not loaded",
    "Current path:",
    location.pathname,
  );

  useEffect(() => {
    console.log("🔄 [APP] AppContent useEffect - Loading tempo routes");
    // Load tempo routes
    getTempoRoutes().then((routes) => {
      console.log("🛣️ [APP] Tempo routes loaded in AppContent:", routes.length);
      setTempoRoutes(routes);
      setAppReady(true);
    });
  }, []);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && userProfile && !loading) {
      console.log("🎯 [APP] Checking onboarding status:", {
        onboardingCompleted: userProfile.onboarding_completed,
        hasProfile: !!userProfile,
      });

      // Show onboarding if user hasn't completed it (with safe fallback)
      const needsOnboarding =
        userProfile.onboarding_completed === false ||
        userProfile.onboarding_completed === undefined;
      if (needsOnboarding) {
        console.log("🎯 [APP] User needs onboarding, showing modal");
        setShowOnboarding(true);
      }
    }
  }, [user, userProfile, loading]);

  if (loading || !appReady) {
    console.log("⏳ [APP] Auth loading state or app not ready");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/spinning-loader.png"
            alt="Loading"
            className="w-16 h-16 animate-spin brightness-150"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("🔐 [APP] No user found, showing login form");
    return <LoginForm />;
  }

  console.log("✅ [APP] User authenticated, rendering main app");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <img
            src="/spinning-loader.png"
            alt="Loading"
            className="w-16 h-16 animate-spin brightness-150"
          />
        </div>
      }
    >
      <>
        {/* Tempo routes - render first if enabled */}
        {import.meta.env.VITE_TEMPO === "true" &&
          tempoRoutes.length > 0 &&
          useRoutes(tempoRoutes)}

        {/* Main app routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/upload" element={<MusicUploader />} />
          <Route path="/earnings" element={<EarningsManager />} />

          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/spotify-callback" element={<SpotifyCallback />} />

          {/* Allow tempo routes to pass through */}
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" element={null} />
          )}

          {/* Catch-all route for 404 - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Onboarding Modal */}
        <OnboardingModal
          open={showOnboarding}
          onOpenChange={(open) => {
            setShowOnboarding(open);
          }}
        />
      </>
    </Suspense>
  );
}

function App() {
  console.log("🎯 [APP] App component rendering");
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
