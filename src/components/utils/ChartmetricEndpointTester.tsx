import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, RefreshCw, Key } from "lucide-react";

interface EndpointTestResult {
  endpoint: string;
  status: "success" | "error" | "pending";
  message: string;
  responseTime?: number;
}

const ChartmetricEndpointTester: React.FC = () => {
  const [refreshToken, setRefreshToken] = useState(
    "CEl5d0bS9kRbPjUgrl9458CPxuyz7RAnSdzyuFs5QpZg7df8hX5hLgLENIKTVcWP",
  );
  const [accessToken, setAccessToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<EndpointTestResult[]>([]);

  const endpoints = [
    { name: "Authentication", path: "/api/token" },
    { name: "Streaming Data", path: "/api/charts/streaming" },
    { name: "Social Media Data", path: "/api/social/stats" },
    { name: "Trending Artists", path: "/api/charts/trending/artists" },
    { name: "Genre Data", path: "/api/charts/genres" },
    { name: "Playlist Data", path: "/api/playlists/stats" },
    { name: "Search", path: "/api/search" },
  ];

  const authenticate = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      const startTime = performance.now();
      const response = await fetch("https://api.chartmetric.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshtoken: refreshToken,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const endTime = performance.now();

      if (!response.ok) {
        const errorText = await response.text();
        setResults([
          {
            endpoint: "/api/token",
            status: "error",
            message: `Authentication failed: ${response.status} ${response.statusText} - ${errorText}`,
            responseTime: Math.round(endTime - startTime),
          },
        ]);
        setIsAuthenticated(false);
        return;
      }

      const data = await response.json();
      if (data.token) {
        setAccessToken(data.token);
        setIsAuthenticated(true);
        setResults([
          {
            endpoint: "/api/token",
            status: "success",
            message: `Authentication successful. Token expires in ${data.expires_in || 3600} seconds.`,
            responseTime: Math.round(endTime - startTime),
          },
        ]);
      } else {
        setIsAuthenticated(false);
        setResults([
          {
            endpoint: "/api/token",
            status: "error",
            message: "Authentication response did not contain a token",
            responseTime: Math.round(endTime - startTime),
          },
        ]);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setResults([
        {
          endpoint: "/api/token",
          status: "error",
          message: `Authentication error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const testEndpoint = async (endpoint: string, path: string) => {
    if (!isAuthenticated || !accessToken) {
      return {
        endpoint: path,
        status: "error" as const,
        message: "Not authenticated. Please authenticate first.",
      };
    }

    try {
      setResults((prev) => [
        ...prev,
        {
          endpoint: path,
          status: "pending",
          message: "Testing endpoint...",
        },
      ]);

      const startTime = performance.now();
      const url = `https://api.chartmetric.com${path}${
        path.includes("?") ? "&" : "?"
      }limit=5`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });
      const endTime = performance.now();

      if (!response.ok) {
        const errorText = await response.text();
        return {
          endpoint: path,
          status: "error" as const,
          message: `Request failed: ${response.status} ${response.statusText} - ${errorText}`,
          responseTime: Math.round(endTime - startTime),
        };
      }

      const data = await response.json();
      return {
        endpoint: path,
        status: "success" as const,
        message: `Success: Received ${data.obj ? (Array.isArray(data.obj) ? data.obj.length : "object") : "no"} data objects`,
        responseTime: Math.round(endTime - startTime),
      };
    } catch (error) {
      return {
        endpoint: path,
        status: "error" as const,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  const testAllEndpoints = async () => {
    if (!isAuthenticated) {
      alert("Please authenticate first");
      return;
    }

    setIsLoading(true);
    setResults([results[0]]); // Keep authentication result

    const endpointResults = [];
    for (const endpoint of endpoints.slice(1)) {
      // Skip authentication endpoint
      const result = await testEndpoint(endpoint.name, endpoint.path);
      endpointResults.push(result);
      setResults((prev) => {
        // Replace pending result with actual result
        const newResults = [...prev];
        const pendingIndex = newResults.findIndex(
          (r) => r.endpoint === result.endpoint && r.status === "pending",
        );
        if (pendingIndex !== -1) {
          newResults[pendingIndex] = result;
        } else {
          newResults.push(result);
        }
        return newResults;
      });
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Chartmetric API Endpoint Tester
        </CardTitle>
        <CardDescription>
          Test all Chartmetric API endpoints to verify connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <Label htmlFor="refreshToken">Refresh Token</Label>
              <Input
                id="refreshToken"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Enter your Chartmetric refresh token"
                className="font-mono text-xs"
              />
            </div>
            <Button
              onClick={authenticate}
              disabled={isLoading || !refreshToken.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Authenticate"
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {isAuthenticated ? (
                <Badge variant="success" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" /> Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" /> Not Connected
                </Badge>
              )}
            </div>
            <Button
              onClick={testAllEndpoints}
              disabled={isLoading || !isAuthenticated}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test All Endpoints"
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test Results</h3>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No tests run yet. Authenticate to begin testing.
            </p>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${result.status === "success" ? "border-green-200 bg-green-50" : result.status === "error" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : result.status === "error" ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                      )}
                      <span className="font-medium">{result.endpoint}</span>
                    </div>
                    {result.responseTime && (
                      <Badge variant="outline">{result.responseTime}ms</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{result.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {results.filter((r) => r.status === "success").length} of{" "}
          {endpoints.length} endpoints tested successfully
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setResults([]);
            setIsAuthenticated(false);
            setAccessToken("");
          }}
          disabled={isLoading}
        >
          Clear Results
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChartmetricEndpointTester;
