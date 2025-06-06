import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CreditCard, Plus, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { createCustomPortalSession, getSubscription } from "@/lib/stripeApi";
import StripeProvider from "@/components/payments/StripeProvider";
import PaymentMethodForm from "@/components/payments/PaymentMethodForm";
import SubscriptionPlans from "@/components/payments/SubscriptionPlans";
import PaymentHistory from "@/components/payments/PaymentHistory";
import { toast } from "@/components/ui/use-toast";

interface CustomerData {
  id: string;
  email: string;
  name: string;
  subscription?: {
    id: string;
    status: string;
    current_period_end: number;
    plan: {
      name: string;
      amount: number;
      currency: string;
      interval: string;
    };
  };
  payment_methods: Array<{
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    isDefault: boolean;
  }>;
}

const BillingTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState("subscription");
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // First, get the user's profile to find their subscription ID
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("stripe_customer_id, stripe_subscription_id")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          setCustomerData(getEmptyCustomerData());
          return;
        }

        const baseCustomerData = {
          id: profile?.stripe_customer_id || "cus_unknown",
          email: user.email || "user@example.com",
          name: user.user_metadata?.name || "OneSync User",
          payment_methods: [],
        };

        // If user has a subscription ID, fetch the live subscription data
        if (profile?.stripe_subscription_id) {
          try {
            const subscription = await getSubscription(
              profile.stripe_subscription_id,
            );

            // Map Stripe subscription to our format
            const mappedSubscription = {
              id: subscription.id,
              status: subscription.status,
              current_period_end: subscription.current_period_end * 1000, // Convert to milliseconds
              plan: {
                name: "OneSync Pro", // You might want to fetch this from the product
                amount: subscription.items.data[0]?.price.unit_amount || 0,
                currency: subscription.items.data[0]?.price.currency || "usd",
                interval:
                  subscription.items.data[0]?.price.recurring?.interval ||
                  "month",
              },
            };

            setCustomerData({
              ...baseCustomerData,
              subscription: mappedSubscription,
            });
          } catch (subscriptionError) {
            console.error("Error fetching subscription:", subscriptionError);
            // Set customer data without subscription if subscription fetch fails
            setCustomerData(baseCustomerData);
          }
        } else {
          // No subscription ID found
          setCustomerData(baseCustomerData);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setCustomerData(getEmptyCustomerData());
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [user]);

  const getEmptyCustomerData = (): CustomerData => {
    return {
      id: user?.id || "unknown",
      email: user?.email || "",
      name: user?.user_metadata?.name || "",
      payment_methods: [],
    };
  };

  const handleManageSubscription = async () => {
    try {
      if (!customerData?.id) {
        throw new Error("Customer ID not found");
      }

      const { url } = await createCustomPortalSession(
        customerData.id,
        `${window.location.origin}/settings`,
      );

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating customer portal session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Billing & Subscription
        </h2>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading subscription details...</span>
            </div>
          ) : customerData?.subscription ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      Your active subscription details
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      customerData.subscription.status === "active"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }
                  >
                    {customerData.subscription.status === "active"
                      ? "Active"
                      : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">
                    {customerData.subscription.plan.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {formatAmount(
                      customerData.subscription.plan.amount,
                      customerData.subscription.plan.currency,
                    )}
                    /{customerData.subscription.plan.interval}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Next billing date</p>
                  <p>
                    {formatDate(customerData.subscription.current_period_end)}
                  </p>
                </div>

                <Button onClick={handleManageSubscription}>
                  Manage Subscription
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose a Subscription Plan</CardTitle>
                  <CardDescription>
                    Select a plan that fits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionPlans />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading payment methods...</span>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your saved payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {customerData?.payment_methods &&
                  customerData.payment_methods.length > 0 ? (
                    <div className="space-y-4">
                      {customerData.payment_methods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium capitalize">
                                {method.brand} •••• {method.last4}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Expires{" "}
                                {method.exp_month.toString().padStart(2, "0")}/
                                {method.exp_year}
                                {method.isDefault && " (Default)"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManageSubscription}
                          >
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">
                        No payment methods found
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Payment Method
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Payment Method</DialogTitle>
                          <DialogDescription>
                            Add a new credit or debit card to your account
                          </DialogDescription>
                        </DialogHeader>
                        <StripeProvider>
                          <PaymentMethodForm
                            onSuccess={() => {
                              // Refresh customer data after adding payment method
                              toast({
                                title: "Success",
                                description:
                                  "Payment method added successfully!",
                              });
                              setTimeout(() => {
                                setLoading(true);
                                setCustomerData(getEmptyCustomerData());
                                setLoading(false);
                              }, 1000);
                            }}
                          />
                        </StripeProvider>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingTab;
