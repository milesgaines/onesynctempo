import React, { useState, useEffect } from "react";

// Add Intercom type definition
declare global {
  interface Window {
    Intercom?: (command: string, ...args: any[]) => void;
  }
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowUpRight,
  Download,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Info,
} from "lucide-react";
import {
  supabase,
  WithdrawalRequest,
  PaymentHistory,
  UserProfile,
} from "@/lib/supabaseClient";
import {
  getRoyaltyAdvances,
  getStripePayouts,
  getStripeBalanceTransaction,
  createRoyaltyAdvance,
  recordRoyaltyRepayment,
  RoyaltyAdvance,
  RoyaltyRepayment,
} from "@/lib/stripeApi";

interface EarningsManagerProps {}

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  platform: string;
  status: "completed" | "pending" | "failed";
  reference: string;
}

interface WithdrawalRequest {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "pending" | "approved" | "completed" | "rejected";
}

const EarningsManager: React.FC<EarningsManagerProps> = () => {
  // State for form inputs
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [accountDetails, setAccountDetails] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [showStripeDetails, setShowStripeDetails] = useState<boolean>(false);

  // Additional state for payment method fields
  const [routingNumber, setRoutingNumber] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>("");
  const [paypalEmail, setPaypalEmail] = useState<string>("");

  // State for data management - all initialized with empty/zero values
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(
    [],
  );
  const [pendingWithdrawals, setPendingWithdrawals] = useState<
    WithdrawalRequest[]
  >([]);
  const [royaltyAdvances, setRoyaltyAdvances] = useState<RoyaltyAdvance[]>([]);
  const [totalAdvanceAmount, setTotalAdvanceAmount] = useState<number>(0);
  const [totalRepaidAmount, setTotalRepaidAmount] = useState<number>(0);
  const [remainingAdvanceBalance, setRemainingAdvanceBalance] =
    useState<number>(0);

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] =
    useState<boolean>(false);
  const [activeTimeFilter, setActiveTimeFilter] = useState<string>("all");

  // Effect to load real data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Load user profile for earnings data
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setTotalEarnings(profile.total_earnings || 0);
          setPendingPayments(profile.pending_payments || 0);
          setAvailableBalance(profile.available_balance || 0);
        }

        // Load payment history
        const { data: payments } = await supabase
          .from("payment_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (payments) {
          const formattedPayments = payments.map((payment) => ({
            id: payment.id,
            date: payment.created_at.split("T")[0],
            amount: payment.amount,
            platform: payment.platform,
            status: payment.status as "completed" | "pending" | "failed",
            reference: payment.reference,
          }));
          setPaymentHistory(formattedPayments);
        }

        // Load withdrawal requests
        const { data: withdrawals } = await supabase
          .from("withdrawal_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (withdrawals) {
          const formattedWithdrawals = withdrawals.map((withdrawal) => ({
            id: withdrawal.id,
            date: withdrawal.created_at.split("T")[0],
            amount: withdrawal.amount,
            method: withdrawal.payment_method,
            status: withdrawal.status as
              | "pending"
              | "approved"
              | "completed"
              | "rejected",
          }));
          setPendingWithdrawals(formattedWithdrawals);
        }

        // Load royalty advances
        const advances = await getRoyaltyAdvances();
        setRoyaltyAdvances(advances);

        // Calculate advance totals
        const totalAdvance = advances.reduce(
          (sum, advance) => sum + advance.amount,
          0,
        );
        const totalRepaid = advances.reduce(
          (sum, advance) => sum + advance.repaidAmount,
          0,
        );
        const remainingBalance = totalAdvance - totalRepaid;

        setTotalAdvanceAmount(totalAdvance);
        setTotalRepaidAmount(totalRepaid);
        setRemainingAdvanceBalance(remainingBalance);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle withdrawal submission with Trolley integration
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingWithdrawal(true);
    setIsDialogOpen(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("User not authenticated");
        setIsProcessingWithdrawal(false);
        return;
      }

      const amount = parseFloat(withdrawalAmount);
      if (isNaN(amount) || amount <= 0 || amount > availableBalance) {
        alert("Invalid withdrawal amount");
        setIsProcessingWithdrawal(false);
        return;
      }

      // Validate payment method specific fields
      if (paymentMethod === "bank-transfer") {
        if (!routingNumber || !accountNumber || !confirmAccountNumber) {
          alert("Please fill in all bank account fields");
          setIsProcessingWithdrawal(false);
          return;
        }

        if (accountNumber !== confirmAccountNumber) {
          alert("Account numbers do not match");
          setIsProcessingWithdrawal(false);
          return;
        }
      } else if (paymentMethod === "paypal" && !paypalEmail) {
        alert("Please enter your PayPal email address");
        setIsProcessingWithdrawal(false);
        return;
      } else if (paymentMethod === "check") {
        // For check requests, open Intercom and don't proceed with withdrawal
        if (window.Intercom) {
          window.Intercom(
            "showNewMessage",
            `I would like to request a check for ${amount}. Please process this withdrawal request.`,
          );
          setIsProcessingWithdrawal(false);
          setWithdrawalAmount("");
          setPaymentMethod("");
          return;
        } else {
          alert(
            "Intercom messenger is not available. Please contact support directly.",
          );
          setIsProcessingWithdrawal(false);
          return;
        }
      } else if (
        paymentMethod !== "bank-transfer" &&
        paymentMethod !== "paypal" &&
        !accountDetails
      ) {
        alert("Please enter your account details");
        setIsProcessingWithdrawal(false);
        return;
      }

      // Get user profile for recipient creation
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        alert("User profile not found");
        setIsProcessingWithdrawal(false);
        return;
      }

      let stripePayoutId = null;
      let stripeExternalAccountId = null;

      // Process payout through Stripe for supported payment methods
      if (["bank-transfer"].includes(paymentMethod)) {
        try {
          // Create external account for bank transfer
          const externalAccountResponse = await supabase.functions.invoke(
            "supabase-functions-stripe-payout-manager",
            {
              body: {
                action: "create_external_account",
                account_holder_name: profile.name || "User",
                routing_number: routingNumber,
                account_number: accountNumber,
                country: "US",
                currency: "usd",
              },
            },
          );

          if (externalAccountResponse.data?.success) {
            stripeExternalAccountId = externalAccountResponse.data.data.id;

            // Create payout to the external account
            const payoutResponse = await supabase.functions.invoke(
              "supabase-functions-stripe-payout-manager",
              {
                body: {
                  action: "create_payout",
                  amount: Math.round(amount * 100), // Convert to cents
                  currency: "usd",
                  destination: stripeExternalAccountId,
                  description: `Withdrawal request for ${amount} USD`,
                  method: "standard",
                },
              },
            );

            if (payoutResponse.data?.success) {
              stripePayoutId = payoutResponse.data.data.id;
            }
          }
        } catch (stripeError) {
          console.warn(
            "Stripe payout failed, falling back to manual processing:",
            stripeError,
          );
        }
      }

      // Prepare account details based on payment method
      let finalAccountDetails = accountDetails;

      if (paymentMethod === "bank-transfer") {
        finalAccountDetails = JSON.stringify({
          routingNumber,
          accountNumber,
        });
      } else if (paymentMethod === "paypal") {
        finalAccountDetails = paypalEmail;
      }

      // Insert withdrawal request into Supabase
      const { data: withdrawal, error } = await supabase
        .from("withdrawal_requests")
        .insert([
          {
            user_id: user.id,
            amount: amount,
            payment_method: paymentMethod || "Bank Transfer",
            account_details: finalAccountDetails,
            status: stripePayoutId ? "processing" : "pending",
            stripe_external_account_id: stripeExternalAccountId,
            stripe_payout_id: stripePayoutId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update user's available balance
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ available_balance: availableBalance - amount })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      const newWithdrawal = {
        id: withdrawal.id,
        date: withdrawal.created_at.split("T")[0],
        amount: withdrawal.amount,
        method: withdrawal.payment_method,
        status: withdrawal.status as
          | "pending"
          | "approved"
          | "completed"
          | "rejected"
          | "processing",
      };

      setPendingWithdrawals([newWithdrawal, ...pendingWithdrawals]);
      setAvailableBalance((prev) => prev - amount);

      // Reset form
      setWithdrawalAmount("");
      setPaymentMethod("");
      setAccountDetails("");
      setRoutingNumber("");
      setAccountNumber("");
      setConfirmAccountNumber("");
      setPaypalEmail("");

      const message = stripePayoutId
        ? "Withdrawal request submitted and is being processed through Stripe!"
        : "Withdrawal request submitted successfully!";
      alert(message);

      // Show Stripe details after submission for better visibility
      setShowStripeDetails(true);
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Failed to submit withdrawal request. Please try again.");
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  // Filter payment history by date
  const filterPaymentHistory = async (timeRange: string) => {
    setActiveTimeFilter(timeRange);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (timeRange !== "all") {
        const today = new Date();
        let cutoffDate = new Date();

        if (timeRange === "30days") {
          cutoffDate.setDate(today.getDate() - 30);
        } else if (timeRange === "90days") {
          cutoffDate.setDate(today.getDate() - 90);
        } else if (timeRange === "year") {
          cutoffDate.setFullYear(today.getFullYear() - 1);
        }

        query = query.gte("created_at", cutoffDate.toISOString());
      }

      const { data: payments } = await query;

      if (payments) {
        const formattedPayments = payments.map((payment) => ({
          id: payment.id,
          date: payment.created_at.split("T")[0],
          amount: payment.amount,
          platform: payment.platform,
          status: payment.status as "completed" | "pending" | "failed",
          reference: payment.reference,
        }));
        setPaymentHistory(formattedPayments);
      }
    } catch (error) {
      console.error("Error filtering payment history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      case "active":
        return <Badge className="bg-blue-500">Active</Badge>;
      case "repaid":
        return <Badge className="bg-green-500">Repaid</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="w-full p-6 space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Earnings Management
        </h1>
        <p className="text-muted-foreground">
          Track your revenue, manage withdrawals, and view payment history.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              {isLoading ? (
                <div className="h-8 w-32 bg-muted/20 animate-pulse rounded"></div>
              ) : (
                <span className="text-2xl font-bold">
                  {formatCurrency(totalEarnings)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earnings across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-3">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              {isLoading ? (
                <div className="h-8 w-32 bg-muted/20 animate-pulse rounded"></div>
              ) : (
                <span className="text-2xl font-bold">
                  {formatCurrency(pendingPayments)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              {isLoading ? (
                <div className="h-8 w-32 bg-muted/20 animate-pulse rounded"></div>
              ) : (
                <span className="text-2xl font-bold">
                  {formatCurrency(availableBalance)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for withdrawal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="balance">
        <TabsList className="grid w-full grid-cols-4 bg-muted/20">
          <TabsTrigger
            value="balance"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 cursor-pointer"
            onClick={() => console.log("💰 [EARNINGS] Balance tab clicked")}
          >
            Balance
          </TabsTrigger>
          <TabsTrigger
            value="advances"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 cursor-pointer"
            onClick={() =>
              console.log("🏦 [EARNINGS] Royalty Advances tab clicked")
            }
          >
            Advances
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 cursor-pointer"
            onClick={() =>
              console.log("📊 [EARNINGS] Payment History tab clicked")
            }
          >
            Payment History
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted/50 cursor-pointer"
            onClick={() => console.log("💸 [EARNINGS] Withdrawals tab clicked")}
          >
            Withdrawals
          </TabsTrigger>
        </TabsList>

        {/* Balance Tab */}
        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>
                Your earnings by platform for the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-24 bg-muted/20 animate-pulse rounded"></div>
                          <div className="h-4 w-20 bg-muted/20 animate-pulse rounded"></div>
                        </div>
                        <div className="h-2 w-full bg-muted/20 animate-pulse rounded"></div>
                      </div>
                    ))}
                </div>
              ) : (
                <RevenueBreakdown paymentHistory={paymentHistory} />
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  try {
                    // Generate comprehensive CSV export
                    const csvHeaders = [
                      "Date",
                      "Platform",
                      "Amount (USD)",
                      "Reference",
                      "Status",
                      "Month",
                      "Year",
                    ];

                    const csvRows = paymentHistory.map((payment) => {
                      const date = new Date(payment.date);
                      return [
                        payment.date,
                        payment.platform,
                        payment.amount.toFixed(2),
                        payment.reference,
                        payment.status,
                        date.toLocaleString("default", { month: "long" }),
                        date.getFullYear().toString(),
                      ];
                    });

                    // Add summary row
                    const totalAmount = paymentHistory.reduce(
                      (sum, p) => sum + p.amount,
                      0,
                    );
                    csvRows.push([
                      "TOTAL",
                      "All Platforms",
                      totalAmount.toFixed(2),
                      "Summary",
                      "Calculated",
                      "",
                      "",
                    ]);

                    const csvContent = [csvHeaders, ...csvRows]
                      .map((row) => row.map((field) => `"${field}"`).join(","))
                      .join("\n");

                    const blob = new Blob([csvContent], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `onesync-payment-history-${new Date().toISOString().split("T")[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    alert(
                      `Payment history exported successfully!\nTotal: ${totalAmount.toFixed(2)}\nRecords: ${paymentHistory.length}`,
                    );
                  } catch (error) {
                    console.error("Export error:", error);
                    alert(
                      "Failed to export payment history. Please try again.",
                    );
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Royalty Advances Tab */}
        <TabsContent value="advances" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Advances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-2xl font-bold">
                      {formatCurrency(totalAdvanceAmount)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total royalty advances received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Amount Repaid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-2xl font-bold">
                      {formatCurrency(totalRepaidAmount)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Repaid through earnings deductions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Remaining Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-3">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-muted/20 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-2xl font-bold">
                      {formatCurrency(remainingAdvanceBalance)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Outstanding advance balance
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Royalty Advances</CardTitle>
              <CardDescription>
                Track your royalty advances and repayment progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Repaid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={`loading-advance-${index}`}>
                          <TableCell>
                            <div className="h-5 w-24 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-32 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : royaltyAdvances.length > 0 ? (
                    royaltyAdvances.map((advance) => {
                      const repaymentProgress =
                        advance.amount > 0
                          ? (advance.repaidAmount / advance.amount) * 100
                          : 0;
                      return (
                        <TableRow key={advance.id}>
                          <TableCell>
                            {formatDate(advance.advanceDate)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(advance.amount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(advance.repaidAmount)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(advance.remainingBalance)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(advance.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={repaymentProgress}
                                className="w-20"
                              />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(repaymentProgress)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center">
                          <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                          <p>No royalty advances found</p>
                          <p className="text-sm">
                            Royalty advances will appear here when available
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground bg-muted/10 p-3 rounded-md">
                <Info className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>
                  Advances are automatically repaid through earnings deductions
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  try {
                    const csvHeaders = [
                      "Date",
                      "Amount",
                      "Repaid",
                      "Remaining",
                      "Status",
                      "Progress %",
                    ];
                    const csvRows = royaltyAdvances.map((advance) => {
                      const progress =
                        advance.amount > 0
                          ? (advance.repaidAmount / advance.amount) * 100
                          : 0;
                      return [
                        advance.advanceDate,
                        advance.amount.toFixed(2),
                        advance.repaidAmount.toFixed(2),
                        advance.remainingBalance.toFixed(2),
                        advance.status,
                        Math.round(progress).toString(),
                      ];
                    });

                    const csvContent = [csvHeaders, ...csvRows]
                      .map((row) => row.map((field) => `"${field}"`).join(","))
                      .join("\n");

                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `royalty-advances-${new Date().toISOString().split("T")[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    alert(
                      `Exported ${royaltyAdvances.length} royalty advances`,
                    );
                  } catch (error) {
                    alert("Export failed. Please try again.");
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardFooter>
          </Card>

          {/* Repayment History */}
          <Card>
            <CardHeader>
              <CardTitle>Repayment History</CardTitle>
              <CardDescription>
                Detailed history of advance repayments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Advance ID</TableHead>
                    <TableHead>Repayment Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array(3)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={`loading-repayment-${index}`}>
                            <TableCell>
                              <div className="h-5 w-24 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-32 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-28 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-40 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                    : royaltyAdvances
                        .flatMap((advance) =>
                          advance.repaymentHistory.map((repayment) => ({
                            ...repayment,
                            advanceId: advance.id,
                          })),
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime(),
                        )
                        .slice(0, 10)
                        .map((repayment) => (
                          <TableRow key={repayment.id}>
                            <TableCell>{formatDate(repayment.date)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {repayment.advanceId.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {formatCurrency(repayment.amount)}
                            </TableCell>
                            <TableCell>
                              {repayment.payoutId ? "Payout" : "Manual"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {repayment.description || "Earnings deduction"}
                            </TableCell>
                          </TableRow>
                        ))}
                  {!isLoading &&
                    royaltyAdvances.every(
                      (advance) => advance.repaymentHistory.length === 0,
                    ) && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No repayment history available
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Recent payments from all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={`loading-${index}`}>
                          <TableCell>
                            <div className="h-5 w-24 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-28 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-32 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{payment.platform}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment.reference}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-4 text-muted-foreground"
                      >
                        No payment history found for the selected time period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  variant={activeTimeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    console.log("Filtering payment history: all");
                    filterPaymentHistory("all");
                  }}
                  disabled={isLoading}
                >
                  All Time
                </Button>
                <Button
                  variant={
                    activeTimeFilter === "30days" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    console.log("Filtering payment history: 30days");
                    filterPaymentHistory("30days");
                  }}
                  disabled={isLoading}
                >
                  30 Days
                </Button>
                <Button
                  variant={
                    activeTimeFilter === "90days" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    console.log("Filtering payment history: 90days");
                    filterPaymentHistory("90days");
                  }}
                  disabled={isLoading}
                >
                  90 Days
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  try {
                    const filteredData = paymentHistory.filter((payment) => {
                      if (activeTimeFilter === "all") return true;
                      const paymentDate = new Date(payment.date);
                      const now = new Date();
                      const daysAgo =
                        activeTimeFilter === "30days"
                          ? 30
                          : activeTimeFilter === "90days"
                            ? 90
                            : 365;
                      const cutoff = new Date(
                        now.getTime() - daysAgo * 24 * 60 * 60 * 1000,
                      );
                      return paymentDate >= cutoff;
                    });

                    const csvHeaders = [
                      "Date",
                      "Platform",
                      "Amount",
                      "Reference",
                      "Status",
                    ];
                    const csvRows = filteredData.map((payment) => [
                      payment.date,
                      payment.platform,
                      payment.amount.toFixed(2),
                      payment.reference,
                      payment.status,
                    ]);

                    const totalFiltered = filteredData.reduce(
                      (sum, p) => sum + p.amount,
                      0,
                    );
                    csvRows.push([
                      "TOTAL",
                      "All Platforms",
                      totalFiltered.toFixed(2),
                      "Summary",
                      "Calculated",
                    ]);

                    const csvContent = [csvHeaders, ...csvRows]
                      .map((row) => row.map((field) => `"${field}"`).join(","))
                      .join("\n");

                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `payment-history-${activeTimeFilter}-${new Date().toISOString().split("T")[0]}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    alert(
                      `Exported ${filteredData.length} payments (${activeTimeFilter})\nTotal: ${totalFiltered.toFixed(2)}`,
                    );
                  } catch (error) {
                    alert("Export failed. Please try again.");
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Withdrawal Request Form */}
            <Card>
              <CardHeader>
                <CardTitle>Request Withdrawal</CardTitle>
                <CardDescription>
                  Withdraw your available balance to your preferred payment
                  method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  {isProcessingWithdrawal && (
                    <div className="p-4 bg-muted/20 rounded-lg flex items-center justify-center">
                      <img
                        src="/spinning-loader.png"
                        alt="Loading"
                        className="h-6 w-6 animate-spin brightness-150 mr-3"
                      />
                      <span>Processing withdrawal request...</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-9"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: {formatCurrency(availableBalance)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="payment-method"
                      className="flex items-center"
                    >
                      Payment Method
                      {paymentMethod === "bank-transfer" && (
                        <Badge className="ml-2 bg-blue-500">
                          Stripe Enabled
                        </Badge>
                      )}
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      required
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="bank-transfer"
                          className="flex items-center"
                        >
                          <div className="flex items-center">
                            Bank Transfer
                            <CreditCard className="ml-2 h-3 w-3 text-blue-600" />
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="paypal"
                          className="flex items-center"
                        >
                          <div className="flex items-center">
                            PayPal
                            <Globe className="ml-2 h-3 w-3 text-orange-600" />
                          </div>
                        </SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentMethod === "bank-transfer" && (
                      <p className="text-xs text-blue-600 flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        Processed via Stripe for secure bank transfers
                      </p>
                    )}
                    {paymentMethod === "paypal" && (
                      <p className="text-xs text-orange-600 flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        PayPal withdrawals processed manually - contact support
                      </p>
                    )}
                  </div>

                  {/* Dynamic form fields based on payment method */}
                  {paymentMethod === "bank-transfer" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="routing-number">
                          Routing Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="routing-number"
                          placeholder="Enter routing number"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-number">
                          Account Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="account-number"
                          placeholder="Enter account number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-account-number">
                          Confirm Account Number{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirm-account-number"
                          placeholder="Confirm account number"
                          value={confirmAccountNumber}
                          onChange={(e) =>
                            setConfirmAccountNumber(e.target.value)
                          }
                          required
                        />
                        {accountNumber &&
                          confirmAccountNumber &&
                          accountNumber !== confirmAccountNumber && (
                            <p className="text-xs text-red-500">
                              Account numbers do not match
                            </p>
                          )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === "paypal" && (
                    <div className="space-y-2">
                      <Label htmlFor="paypal-email">PayPal Email Address</Label>
                      <Input
                        id="paypal-email"
                        type="email"
                        placeholder="Enter PayPal email address"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {paymentMethod === "check" && (
                    <div className="space-y-2 flex flex-col items-center">
                      <p className="text-sm text-muted-foreground text-center mb-2">
                        Request a check to be mailed to your address on file
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          // Open Intercom messenger with prefilled message
                          if (window.Intercom) {
                            window.Intercom(
                              "showNewMessage",
                              `I would like to request a check for ${withdrawalAmount ? `${withdrawalAmount}` : "my available balance"}. Please process this withdrawal request.`,
                            );
                          } else {
                            alert(
                              "Intercom messenger is not available. Please contact support directly.",
                            );
                          }
                        }}
                      >
                        Request a Check
                      </Button>
                    </div>
                  )}

                  {paymentMethod &&
                    paymentMethod !== "bank-transfer" &&
                    paymentMethod !== "paypal" &&
                    paymentMethod !== "check" && (
                      <div className="space-y-2">
                        <Label htmlFor="account-details">Account Details</Label>
                        <Input
                          id="account-details"
                          placeholder="Enter account details"
                          value={accountDetails}
                          onChange={(e) => setAccountDetails(e.target.value)}
                          required
                        />
                      </div>
                    )}

                  <AlertDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        className="w-full"
                        disabled={
                          isProcessingWithdrawal ||
                          !withdrawalAmount ||
                          !paymentMethod ||
                          (paymentMethod === "bank-transfer" &&
                            (!routingNumber ||
                              !accountNumber ||
                              !confirmAccountNumber ||
                              accountNumber !== confirmAccountNumber)) ||
                          (paymentMethod === "paypal" && !paypalEmail) ||
                          (paymentMethod !== "bank-transfer" &&
                            paymentMethod !== "paypal" &&
                            paymentMethod !== "check" &&
                            !accountDetails)
                        }
                        onClick={() => {
                          console.log("Opening withdrawal dialog");
                          setIsDialogOpen(true);
                        }}
                      >
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Request Withdrawal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
                        <AlertDialogDescription>
                          You are about to request a withdrawal of{" "}
                          {withdrawalAmount
                            ? formatCurrency(parseFloat(withdrawalAmount))
                            : "$0.00"}{" "}
                          to your {paymentMethod || "selected payment method"}.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleWithdrawalSubmit}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </form>
              </CardContent>
            </Card>

            {/* Pending Withdrawals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
                <CardDescription>
                  Status of your recent withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(3)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={`loading-withdrawal-${index}`}>
                            <TableCell>
                              <div className="h-5 w-24 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-28 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-20 bg-muted/20 animate-pulse rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : pendingWithdrawals.length > 0 ? (
                      pendingWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{formatDate(withdrawal.date)}</TableCell>
                          <TableCell>
                            {formatCurrency(withdrawal.amount)}
                          </TableCell>
                          <TableCell>{withdrawal.method}</TableCell>
                          <TableCell>
                            {getStatusBadge(withdrawal.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No pending withdrawals
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <div className="flex items-center text-sm text-muted-foreground bg-muted/10 p-3 rounded-md">
                  <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>
                    Withdrawals typically process within 3-5 business days
                  </span>
                </div>

                {/* Stripe Integration Status Indicator */}
                <div className="mt-3 flex items-center text-sm bg-blue-50 text-blue-700 p-3 rounded-md border border-blue-200">
                  <CreditCard className="mr-2 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <span>
                    <strong>Stripe</strong> integration active for secure
                    payouts
                  </span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Revenue breakdown component
const RevenueBreakdown: React.FC<{ paymentHistory: PaymentHistoryItem[] }> = ({
  paymentHistory,
}) => {
  const platformTotals = paymentHistory.reduce(
    (acc, payment) => {
      if (payment.status === "completed") {
        acc[payment.platform] = (acc[payment.platform] || 0) + payment.amount;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalRevenue = Object.values(platformTotals).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const sortedPlatforms = Object.entries(platformTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (sortedPlatforms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No revenue data available</p>
        <p className="text-sm">
          Revenue will appear here once you start earning from your music
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedPlatforms.map(([platform, amount]) => {
        const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
        return (
          <div key={platform} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{platform}</span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(amount)}
              </span>
            </div>
            <Progress value={percentage} />
          </div>
        );
      })}
    </div>
  );
};

export default EarningsManager;
