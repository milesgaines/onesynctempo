import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import {
  getProducts,
  getPrices,
  StripeProduct,
  StripePrice,
  createCheckoutSession,
} from "@/lib/stripeApi";
import { useAuth } from "@/components/auth/AuthProvider";

interface SubscriptionPlansProps {
  onSelectPlan?: (priceId: string) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSelectPlan,
}) => {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadProductsAndPrices = async () => {
      try {
        const [productsData, pricesData] = await Promise.all([
          getProducts(),
          getPrices(),
        ]);

        setProducts(productsData);
        setPrices(pricesData);
      } catch (error) {
        console.error("Error loading subscription data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProductsAndPrices();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      alert("Please log in to subscribe");
      return;
    }

    setSubscribing(priceId);
    try {
      const { sessionId, url } = await createCheckoutSession(
        priceId,
        `${window.location.origin}/settings?subscription=success`,
        `${window.location.origin}/settings?subscription=canceled`,
      );

      if (url) {
        window.location.href = url;
      } else if (onSelectPlan) {
        onSelectPlan(priceId);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start subscription process. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  // Helper to find price for a product
  const getProductPrice = (productId: string) => {
    return prices.find((price) => price.product === productId);
  };

  // Format price for display
  const formatPrice = (price: StripePrice) => {
    const amount = price.unit_amount / 100;
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    });

    const formattedAmount = formatter.format(amount);

    if (price.recurring) {
      return `${formattedAmount}/${price.recurring.interval}`;
    }

    return formattedAmount;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading subscription plans...</span>
      </div>
    );
  }

  // If no products or prices are available, show empty state
  if (products.length === 0 || prices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No subscription plans available
        </p>
        <p className="text-sm text-muted-foreground">
          Subscription plans will be displayed here when configured
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map((product) => {
        const price = getProductPrice(product.id);
        const isPopular = product.metadata?.popular === "true";
        const features = product.metadata?.features
          ? product.metadata.features.split(",").map((f) => f.trim())
          : [];

        return (
          <Card
            key={product.id}
            className={`flex flex-col ${isPopular ? "border-primary shadow-lg" : ""}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {product.description}
                  </CardDescription>
                </div>
                {isPopular && <Badge className="bg-primary">Popular</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              {price && (
                <div className="text-3xl font-bold mb-5">
                  {formatPrice(price)}
                </div>
              )}
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {price && (
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleSubscribe(price.id)}
                  disabled={subscribing === price.id}
                >
                  {subscribing === price.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Choose Plan"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default SubscriptionPlans;
