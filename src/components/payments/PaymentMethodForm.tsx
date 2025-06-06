import React, { useState } from "react";
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
import { createSetupIntent } from "@/lib/stripeApi";
import { useAuth } from "@/components/auth/AuthProvider";

interface PaymentMethodFormProps {
  onSuccess?: (paymentMethod: any) => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get setup intent from your backend
      const setupIntent = await createSetupIntent();

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm card setup
      const result = await stripe.confirmCardSetup(setupIntent.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        },
      });

      if (result.error) {
        setError(
          result.error.message || "An error occurred with your payment method",
        );
      } else {
        setSucceeded(true);
        if (onSuccess && result.setupIntent?.payment_method) {
          onSuccess(result.setupIntent.payment_method);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Add Payment Method
        </CardTitle>
        <CardDescription>
          Securely add a credit or debit card to your account
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
            <div className="flex items-center justify-center p-6 text-green-500">
              <CheckCircle className="mr-2 h-6 w-6" />
              <span className="text-lg font-medium">
                Payment method added successfully!
              </span>
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
                <p>Your card information is securely processed by Stripe.</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!succeeded && (
            <Button
              type="submit"
              className="w-full"
              disabled={processing || !stripe || succeeded}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Save Payment Method"
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default PaymentMethodForm;
