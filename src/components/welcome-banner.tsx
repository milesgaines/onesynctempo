import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, X } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

interface WelcomeBannerProps {
  onDismiss: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onDismiss }) => {
  const { user, refreshUserProfile } = useAuth();

  const handleDismiss = async () => {
    if (user) {
      try {
        // Update user profile to mark onboarding as completed
        const { error } = await supabase
          .from("user_profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);

        if (error) {
          console.error(
            "❌ [WELCOME] Error updating onboarding status:",
            error,
          );
        } else {
          console.log("✅ [WELCOME] Onboarding status updated successfully");
          // Refresh the user profile to reflect the change
          await refreshUserProfile();
        }
      } catch (error) {
        console.error("❌ [WELCOME] Error in handleDismiss:", error);
      }
    }

    // Call the original onDismiss callback
    onDismiss();
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
              <Zap className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Welcome to OneSync</h3>
              <p className="text-sm text-muted-foreground mb-4">
                OneSync is a revolutionary music distribution and royalty
                management platform built for independent artists, producers,
                and audio engineers. With tools for beat sales, metadata
                organization, contract automation, and DSP distribution, OneSync
                empowers creators to fully own and monetize their music.
              </p>
              <div className="flex space-x-4">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    alert(
                      "Interactive tour coming soon! We'll guide you through all the features of OneSync.",
                    );
                  }}
                >
                  Take the tour
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.open("https://onesync.com/docs", "_blank");
                  }}
                >
                  Learn more
                </Button>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeBanner;
