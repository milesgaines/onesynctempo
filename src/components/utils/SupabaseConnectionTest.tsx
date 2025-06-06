import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Check, AlertCircle, Loader2 } from "lucide-react";

const SupabaseConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    connection: boolean;
    tracksBucket: boolean;
    artworkBucket: boolean;
    tracksTable: boolean;
    message?: string;
  } | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      // Test 1: Check connection to Supabase
      console.log("Testing Supabase connection...");
      const { data: connectionTest, error: connectionError } = await supabase
        .from("tracks")
        .select("count()")
        .limit(1);

      if (connectionError) {
        console.error("❌ [TEST] Connection error details:", {
          code: connectionError.code,
          message: connectionError.message,
          details: connectionError.details,
          hint: connectionError.hint,
        });
        throw new Error(
          `Connection failed: ${connectionError.message} (Code: ${connectionError.code})`,
        );
      }

      // Test 2: Check if tracks bucket exists
      console.log("Checking tracks bucket...");
      const { data: tracksBuckets, error: tracksError } =
        await supabase.storage.getBucket("tracks");

      // Test 3: Check if artwork bucket exists
      console.log("Checking artwork bucket...");
      const { data: artworkBuckets, error: artworkError } =
        await supabase.storage.getBucket("artwork");

      // Test 4: Check if tracks table exists by trying to get its structure
      console.log("Checking tracks table...");
      const { data: tracksTable, error: tracksTableError } = await supabase
        .from("tracks")
        .select("id")
        .limit(1);

      setResults({
        connection: !connectionError,
        tracksBucket: !tracksError,
        artworkBucket: !artworkError,
        tracksTable: !tracksTableError,
        message: "All tests completed",
      });
    } catch (error) {
      console.error("Test failed:", error);
      setResults({
        connection: false,
        tracksBucket: false,
        artworkBucket: false,
        tracksTable: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <img
                src="/spinning-loader.png"
                alt="Loading"
                className="mr-2 h-4 w-4 animate-spin brightness-150"
              />
              Testing Connection...
            </>
          ) : (
            "Test Supabase Connection"
          )}
        </Button>

        {results && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span>Connection to Supabase:</span>
              {results.connection ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>"tracks" bucket exists:</span>
              {results.tracksBucket ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>"artwork" bucket exists:</span>
              {results.artworkBucket ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>"tracks" table exists:</span>
              {results.tracksTable ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            {!results.connection ||
            !results.tracksBucket ||
            !results.artworkBucket ||
            !results.tracksTable ? (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md text-sm mt-4">
                {results.message}
              </div>
            ) : (
              <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md text-sm mt-4">
                All systems ready! Your MusicUploader should work correctly.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
