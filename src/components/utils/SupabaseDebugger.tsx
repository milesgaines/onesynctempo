import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import toast from "react-hot-toast";

interface SupabaseDebuggerProps {
  onComplete?: () => void;
}

const SupabaseDebugger: React.FC<SupabaseDebuggerProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    [key: string]: { success: boolean; message: string };
  }>({});

  const runTests = async () => {
    setIsLoading(true);
    setResults({});
    const testResults: {
      [key: string]: { success: boolean; message: string };
    } = {};

    // Test 1: Connection with detailed diagnostics
    try {
      console.log("🔍 [DEBUG] Testing Supabase connection...");
      console.log("🔍 [DEBUG] Using Supabase URL:", supabase.supabaseUrl);

      const { error } = await supabase.from("tracks").select("count").limit(1);

      if (error) {
        console.error("❌ [DEBUG] Connection test failed:", error);
        console.error("❌ [DEBUG] Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        let errorMessage = `Connection failed: ${error.message} (Code: ${error.code})`;

        // Add helpful hints based on error code
        if (error.code === "42P01") {
          errorMessage +=
            " - The 'tracks' table doesn't exist. Please run the SQL schema.";
        } else if (error.code === "PGRST116") {
          errorMessage += " - Invalid API key or unauthorized access.";
        } else if (error.code === "PGRST301") {
          errorMessage +=
            " - Database connection error. Check your Supabase URL.";
        }

        testResults.connection = {
          success: false,
          message: errorMessage,
        };
      } else {
        console.log("✅ [DEBUG] Connection test successful");
        testResults.connection = {
          success: true,
          message: "Successfully connected to Supabase",
        };
      }
    } catch (error) {
      console.error("❌ [DEBUG] Connection test exception:", error);
      testResults.connection = {
        success: false,
        message: `Connection exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Test 2: Authentication
    try {
      console.log("🔍 [DEBUG] Testing authentication...");
      if (!user) {
        testResults.authentication = {
          success: false,
          message: "No authenticated user found",
        };
      } else {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          console.error("❌ [DEBUG] Authentication test failed:", error);
          testResults.authentication = {
            success: false,
            message: `Authentication failed: ${error?.message || "No user data returned"}`,
          };
        } else {
          console.log("✅ [DEBUG] Authentication test successful");
          testResults.authentication = {
            success: true,
            message: `Authenticated as ${data.user.email}`,
          };
        }
      }
    } catch (error) {
      console.error("❌ [DEBUG] Authentication test exception:", error);
      testResults.authentication = {
        success: false,
        message: `Authentication exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Test 3: Tracks Table
    try {
      console.log("🔍 [DEBUG] Testing tracks table...");
      const { data, error } = await supabase
        .from("tracks")
        .select("id")
        .limit(1);

      if (error) {
        console.error("❌ [DEBUG] Tracks table test failed:", error);
        testResults.tracksTable = {
          success: false,
          message: `Tracks table error: ${error.message} (Code: ${error.code})`,
        };

        // If table doesn't exist, suggest creating it
        if (error.code === "42P01") {
          testResults.tracksTable.message +=
            ". The tracks table does not exist in your database.";
        }
      } else {
        console.log("✅ [DEBUG] Tracks table test successful");
        testResults.tracksTable = {
          success: true,
          message: `Tracks table exists and is accessible`,
        };
      }
    } catch (error) {
      console.error("❌ [DEBUG] Tracks table test exception:", error);
      testResults.tracksTable = {
        success: false,
        message: `Tracks table exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Test 4: Storage
    try {
      console.log("🔍 [DEBUG] Testing storage access...");
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error("❌ [DEBUG] Storage test failed:", error);
        testResults.storage = {
          success: false,
          message: `Storage access error: ${error.message}`,
        };
      } else {
        console.log(
          "✅ [DEBUG] Storage test successful, found buckets:",
          data?.length || 0,
        );
        testResults.storage = {
          success: true,
          message: `Storage is accessible. Found ${data?.length || 0} buckets.`,
        };
      }
    } catch (error) {
      console.error("❌ [DEBUG] Storage test exception:", error);
      testResults.storage = {
        success: false,
        message: `Storage exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Test 5: Write Test with complete required fields
    if (user) {
      try {
        console.log("🔍 [DEBUG] Testing write capability...");
        const testId = `test_${Date.now()}`;
        const testData = {
          id: testId,
          user_id: user.id,
          title: "Test Track",
          artist: "Test Artist",
          genre: "test",
          release_date: new Date().toISOString().split("T")[0],
          description: "Test description",
          audio_file_url: "https://example.com/test.wav",
          artwork_url: "https://example.com/test.jpg",
          platforms: ["test"],
          is_explicit: false,
          plays: 0,
          revenue: 0,
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log(
          "📦 [DEBUG] Test data being sent:",
          JSON.stringify(testData, null, 2),
        );

        const { error: insertError } = await supabase
          .from("tracks")
          .insert([testData]);

        if (insertError) {
          console.error("❌ [DEBUG] Write test failed:", insertError);
          testResults.writeTest = {
            success: false,
            message: `Write test failed: ${insertError.message} (Code: ${insertError.code})`,
          };
        } else {
          // Clean up the test record
          const { error: deleteError } = await supabase
            .from("tracks")
            .delete()
            .eq("id", testId);

          if (deleteError) {
            console.warn(
              "⚠️ [DEBUG] Failed to clean up test record:",
              deleteError,
            );
          }

          console.log("✅ [DEBUG] Write test successful");
          testResults.writeTest = {
            success: true,
            message: "Successfully wrote and deleted a test record",
          };
        }
      } catch (error) {
        console.error("❌ [DEBUG] Write test exception:", error);
        testResults.writeTest = {
          success: false,
          message: `Write test exception: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    } else {
      testResults.writeTest = {
        success: false,
        message: "Write test skipped: No authenticated user",
      };
    }

    setResults(testResults);
    setIsLoading(false);

    // Show summary toast
    const successCount = Object.values(testResults).filter(
      (r) => r.success,
    ).length;
    const totalTests = Object.keys(testResults).length;

    if (successCount === totalTests) {
      toast.success(
        `All ${totalTests} Supabase tests passed! Your database connection is working correctly.`,
      );
    } else {
      toast.error(
        `${successCount}/${totalTests} tests passed. Please check the results for details.`,
      );
    }

    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> Supabase Connection Debugger
        </CardTitle>
        <CardDescription>
          Run tests to verify your Supabase connection and database setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(results).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(results).map(([test, result]) => (
              <Alert
                key={test}
                variant={result.success ? "default" : "destructive"}
              >
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className="flex justify-between items-center">
                  <span>
                    <span className="font-medium capitalize">{test}:</span>{" "}
                    {result.message}
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click the button below to run Supabase connection tests</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runTests} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <img
                src="/spinning-loader.png"
                alt="Loading"
                className="mr-2 h-4 w-4 animate-spin brightness-150"
              />
              Running Tests...
            </>
          ) : (
            <>Run Supabase Tests</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SupabaseDebugger;
