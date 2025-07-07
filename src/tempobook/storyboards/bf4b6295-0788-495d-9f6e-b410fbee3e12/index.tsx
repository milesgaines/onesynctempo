import MusicUploader from "@/components/upload/MusicUploader";
import SupabaseDebugger from "@/components/utils/SupabaseDebugger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import AuthWrapper from "../auth-provider-wrapper";

export default function UploadDebugStoryboard() {
  return (
    <AuthWrapper>
      {({ user }) => (
        <div className="bg-background min-h-screen p-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Upload Debug Environment
                  {user ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need to be logged in to test uploads. Please log in
                      first.
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="uploader" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="uploader">Music Uploader</TabsTrigger>
                    <TabsTrigger value="debugger">
                      Supabase Debugger
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="uploader" className="mt-6">
                    <MusicUploader
                      onComplete={(data) => {
                        console.log(
                          "🎉 [DEBUG] Upload completed with data:",
                          data,
                        );
                        alert(`Upload completed! Track ID: ${data.trackId}`);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="debugger" className="mt-6">
                    <SupabaseDebugger
                      onComplete={() => {
                        console.log("🔍 [DEBUG] Supabase tests completed");
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AuthWrapper>
  );
}
