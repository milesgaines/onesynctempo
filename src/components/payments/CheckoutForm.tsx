import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
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
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { createPaymentIntent } from "@/lib/stripeApi";

interface CheckoutFormProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentIntent: any) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  currency = "usd",
  description = "OneSync Payment",
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const getPaymentIntent = async () => {
      try {
        const paymentIntent = await createPaymentIntent(amount, currency);
        setClientSecret(paymentIntent.client_secret);
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment");
      }
    };

    getPaymentIntent();
  }, [amount, currency]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "OneSync User",
          },
        },
        receipt_email: "user@example.com", // This should be dynamically set from user data
      });

      if (result.error) {
        setError(result.error.message || "An error occurred with your payment");
      } else if (result.paymentIntent?.status === "succeeded") {
        setSucceeded(true);
        if (onSuccess) {
          onSuccess(result.paymentIntent);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    });
    return formatter.format(amount / 100);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          {description} - {formatAmount(amount, currency)}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {succeeded ? (
            <div className="flex flex-col items-center justify-center p-6 text-green-500 space-y-2">
              <CheckCircle className="h-12 w-12" />
              <span className="text-lg font-medium">Payment successful!</span>
              <p className="text-sm text-muted-foreground text-center">
                Thank you for your payment. A receipt has been sent to your
                email.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-background">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": {
                          color: "#aab7c4",
                        },
                      },
                      invalid: {
                        color: "#9e2146",
                      },
                    },
                  }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Your payment is secured by Stripe.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!succeeded && (
            <Button
              type="submit"
              className="w-full"
              disabled={processing || !stripe || !clientSecret || succeeded}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatAmount(amount, currency)}`
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default CheckoutForm;
