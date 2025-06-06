import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  createTrolleyRecipient,
  createTrolleyPayout,
  getTrolleyRecipient,
  getTrolleyPayoutStatus,
} from "@/lib/stripeApi";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  details?: any;
}

const TrolleyIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testRecipientId, setTestRecipientId] = useState<string>("");
  const [testPayoutId, setTestPayoutId] = useState<string>("");

  // Test form data
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testFirstName, setTestFirstName] = useState("Test");
  const [testLastName, setTestLastName] = useState("User");
  const [testAmount, setTestAmount] = useState("10.00");

  const addResult = (result: TestResult) => {
    setTestResults((prev) => [...prev, result]);
  };

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults((prev) =>
      prev.map((result) =>
        result.name === name ? { ...result, ...updates } : result,
      ),
    );
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Check Environment Variables
      addResult({
        name: "Environment Variables",
        status: "pending",
        message: "Checking Trolley API credentials...",
      });

      // We can't directly check env vars in frontend, but we can test the edge function response
      try {
        const envTestResponse = await supabase.functions.invoke(
          "supabase-functions-create-trolley-recipient",
          {
            body: {
              email: "test@test.com",
              firstName: "Test",
              lastName: "Test",
            },
          },
        );

        if (envTestResponse.error?.message?.includes("not configured")) {
          updateResult("Environment Variables", {
            status: "error",
            message: "Trolley API credentials not configured in environment",
            details: envTestResponse.error,
          });
          return;
        } else {
          updateResult("Environment Variables", {
            status: "success",
            message: "Trolley API credentials are configured",
          });
        }
      } catch (error) {
        updateResult("Environment Variables", {
          status: "error",
          message: "Failed to test environment variables",
          details: error,
        });
      }

      // Test 2: Edge Functions Deployment
      addResult({
        name: "Edge Functions",
        status: "pending",
        message: "Testing Trolley edge functions...",
      });

      const edgeFunctions = [
        "supabase-functions-create-trolley-recipient",
        "supabase-functions-get-trolley-recipient",
        "supabase-functions-process-trolley-payout",
        "supabase-functions-get-trolley-payout-status",
      ];

      let functionsWorking = 0;
      for (const func of edgeFunctions) {
        try {
          const response = await supabase.functions.invoke(func, {
            body: { test: true },
          });
          if (
            !response.error ||
            response.error.message !== "Function not found"
          ) {
            functionsWorking++;
          }
        } catch (error) {
          console.warn(`Function ${func} test failed:`, error);
        }
      }

      updateResult("Edge Functions", {
        status: functionsWorking === edgeFunctions.length ? "success" : "error",
        message: `${functionsWorking}/${edgeFunctions.length} edge functions are deployed`,
        details: { functionsWorking, total: edgeFunctions.length },
      });

      // Test 3: Create Trolley Recipient
      addResult({
        name: "Create Recipient",
        status: "pending",
        message: "Creating test Trolley recipient...",
      });

      try {
        const recipient = await createTrolleyRecipient(
          testEmail,
          testFirstName,
          testLastName,
        );

        if (recipient && recipient.id) {
          setTestRecipientId(recipient.id);
          updateResult("Create Recipient", {
            status: "success",
            message: `Recipient created successfully: ${recipient.id}`,
            details: recipient,
          });

          // Test 4: Get Trolley Recipient
          addResult({
            name: "Get Recipient",
            status: "pending",
            message: "Fetching recipient details...",
          });

          try {
            const fetchedRecipient = await getTrolleyRecipient(recipient.id);
            updateResult("Get Recipient", {
              status: "success",
              message: "Recipient fetched successfully",
              details: fetchedRecipient,
            });
          } catch (error) {
            updateResult("Get Recipient", {
              status: "error",
              message: "Failed to fetch recipient",
              details: error,
            });
          }

          // Test 5: Create Payout (small test amount)
          addResult({
            name: "Create Payout",
            status: "pending",
            message: "Creating test payout...",
          });

          try {
            const payout = await createTrolleyPayout(
              recipient.id,
              parseFloat(testAmount),
              "USD",
              "Test payout from OneSync integration test",
            );

            if (payout && payout.id) {
              setTestPayoutId(payout.id);
              updateResult("Create Payout", {
                status: "success",
                message: `Payout created successfully: ${payout.id}`,
                details: payout,
              });

              // Test 6: Get Payout Status
              addResult({
                name: "Get Payout Status",
                status: "pending",
                message: "Checking payout status...",
              });

              try {
                const payoutStatus = await getTrolleyPayoutStatus(payout.id);
                updateResult("Get Payout Status", {
                  status: "success",
                  message: `Payout status: ${payoutStatus.status}`,
                  details: payoutStatus,
                });
              } catch (error) {
                updateResult("Get Payout Status", {
                  status: "error",
                  message: "Failed to get payout status",
                  details: error,
                });
              }
            } else {
              updateResult("Create Payout", {
                status: "error",
                message: "Payout creation failed - no ID returned",
                details: payout,
              });
            }
          } catch (error) {
            updateResult("Create Payout", {
              status: "error",
              message: "Failed to create payout",
              details: error,
            });
          }
        } else {
          updateResult("Create Recipient", {
            status: "error",
            message: "Recipient creation failed - no ID returned",
            details: recipient,
          });
        }
      } catch (error) {
        updateResult("Create Recipient", {
          status: "error",
          message: "Failed to create recipient",
          details: error,
        });
      }

      // Test 7: Database Schema Check
      addResult({
        name: "Database Schema",
        status: "pending",
        message: "Checking withdrawal_requests table schema...",
      });

      try {
        const { data, error } = await supabase
          .from("withdrawal_requests")
          .select("trolley_recipient_id, trolley_payout_id")
          .limit(1);

        if (error) {
          updateResult("Database Schema", {
            status: "error",
            message: "Database schema missing Trolley fields",
            details: error,
          });
        } else {
          updateResult("Database Schema", {
            status: "success",
            message: "Database schema includes Trolley fields",
            details: "trolley_recipient_id and trolley_payout_id columns exist",
          });
        }
      } catch (error) {
        updateResult("Database Schema", {
          status: "error",
          message: "Failed to check database schema",
          details: error,
        });
      }
    } catch (error) {
      console.error("Comprehensive test failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "pending":
        return <Badge className="bg-blue-500">Running</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const overallStatus =
    testResults.length > 0
      ? testResults.every((r) => r.status === "success")
        ? "success"
        : testResults.some((r) => r.status === "error")
          ? "error"
          : "pending"
      : "pending";

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6 bg-background">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Trolley Integration Test Suite
          </CardTitle>
          <p className="text-muted-foreground">
            Comprehensive test to verify Trolley API integration functionality
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email</Label>
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-amount">Test Amount (USD)</Label>
              <Input
                id="test-amount"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-first-name">First Name</Label>
              <Input
                id="test-first-name"
                value={testFirstName}
                onChange={(e) => setTestFirstName(e.target.value)}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-last-name">Last Name</Label>
              <Input
                id="test-last-name"
                value={testLastName}
                onChange={(e) => setTestLastName(e.target.value)}
                disabled={isRunning}
              />
            </div>
          </div>

          {/* Run Test Button */}
          <Button
            onClick={runComprehensiveTest}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Trolley Integration Test"
            )}
          </Button>

          {/* Overall Status */}
          {testResults.length > 0 && (
            <Alert
              className={`${
                overallStatus === "success"
                  ? "border-green-500 bg-green-50"
                  : overallStatus === "error"
                    ? "border-red-500 bg-red-50"
                    : "border-blue-500 bg-blue-50"
              }`}
            >
              {getStatusIcon(overallStatus)}
              <AlertDescription className="ml-2">
                {overallStatus === "success"
                  ? "✅ All tests passed! Trolley integration is fully functional."
                  : overallStatus === "error"
                    ? "❌ Some tests failed. Check the details below."
                    : "🔄 Tests are running..."}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {testResults.map((result, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Test IDs Display */}
          {(testRecipientId || testPayoutId) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              {testRecipientId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    <strong>Recipient ID:</strong> {testRecipientId}
                  </span>
                </div>
              )}
              {testPayoutId && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">
                    <strong>Payout ID:</strong> {testPayoutId}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrolleyIntegrationTest;
