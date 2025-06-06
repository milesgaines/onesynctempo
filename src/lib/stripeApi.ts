import { supabase } from "./supabaseClient";

// Types for Stripe API responses
export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  default_price?: string;
  images: string[];
  metadata: Record<string, string>;
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
    interval_count: number;
  };
  metadata: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: StripePrice;
    }>;
  };
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

// API functions for Stripe operations
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  try {
    const { data: sessionData, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: { priceId, successUrl, cancelUrl },
      },
    );

    if (error) throw error;
    return sessionData;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function createCustomPortalSession(
  customerId: string,
  returnUrl: string,
) {
  try {
    const { data: portalData, error } = await supabase.functions.invoke(
      "create-portal-session",
      {
        body: { customerId, returnUrl },
      },
    );

    if (error) throw error;
    return portalData;
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    throw error;
  }
}

export async function getProducts() {
  try {
    const { data, error } = await supabase.functions.invoke("get-products", {});

    if (error) throw error;
    return data.products as StripeProduct[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getPrices() {
  try {
    const { data, error } = await supabase.functions.invoke("get-prices", {});

    if (error) throw error;
    return data.prices as StripePrice[];
  } catch (error) {
    console.error("Error fetching prices:", error);
    return [];
  }
}

export async function getCustomerSubscriptions(customerId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "get-customer-subscriptions",
      {
        body: { customerId },
      },
    );

    if (error) throw error;
    return data.subscriptions as StripeSubscription[];
  } catch (error) {
    console.error("Error fetching customer subscriptions:", error);
    return [];
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-subscription",
      {
        body: { subscriptionId },
      },
    );

    if (error) throw error;
    return data.subscription as StripeSubscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw error;
  }
}

export async function createPaymentIntent(
  amount: number,
  currency: string = "usd",
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-payment-intent",
      {
        body: { amount, currency },
      },
    );

    if (error) throw error;
    return data as StripePaymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
}

export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "get-payment-methods",
      {
        body: { customerId },
      },
    );

    if (error) throw error;
    return data.paymentMethods as StripePaymentMethod[];
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return [];
  }
}

export async function createSetupIntent() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-setup-intent",
      {},
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw error;
  }
}

// Trolley API Types and Functions
export interface TrolleyRecipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  accounts: TrolleyAccount[];
}

export interface TrolleyAccount {
  id: string;
  type: string;
  primary: boolean;
  currency: string;
  country: string;
  iban?: string;
  accountNumber?: string;
  routingNumber?: string;
}

export interface TrolleyPayout {
  id: string;
  status: string;
  amount: string;
  currency: string;
  recipient: {
    id: string;
    email: string;
  };
  memo?: string;
  processedAt?: string;
  estimatedDeliveryAt?: string;
}

export interface TrolleyBatch {
  id: string;
  status: string;
  amount: string;
  currency: string;
  totalPayouts: number;
  processedAt?: string;
  completedAt?: string;
}

// Trolley API Functions
export async function createTrolleyRecipient(
  email: string,
  firstName: string,
  lastName: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-trolley-recipient",
      {
        body: { email, firstName, lastName },
      },
    );

    if (error) throw error;
    return data as TrolleyRecipient;
  } catch (error) {
    console.error("Error creating Trolley recipient:", error);
    throw error;
  }
}

export async function getTrolleyRecipient(recipientId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-trolley-recipient",
      {
        body: { recipientId },
      },
    );

    if (error) throw error;
    return data as TrolleyRecipient;
  } catch (error) {
    console.error("Error fetching Trolley recipient:", error);
    throw error;
  }
}

export async function createTrolleyPayout(
  recipientId: string,
  amount: number,
  currency: string = "USD",
  memo?: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-process-trolley-payout",
      {
        body: { recipientId, amount, currency, memo },
      },
    );

    if (error) throw error;
    return data as TrolleyPayout;
  } catch (error) {
    console.error("Error creating Trolley payout:", error);
    throw error;
  }
}

export async function getTrolleyPayoutStatus(payoutId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-trolley-payout-status",
      {
        body: { payoutId },
      },
    );

    if (error) throw error;
    return data as TrolleyPayout;
  } catch (error) {
    console.error("Error fetching Trolley payout status:", error);
    throw error;
  }
}

export async function createTrolleyBatch(
  payouts: Array<{
    recipientId: string;
    amount: number;
    currency?: string;
    memo?: string;
  }>,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-trolley-batch",
      {
        body: { payouts },
      },
    );

    if (error) throw error;
    return data as TrolleyBatch;
  } catch (error) {
    console.error("Error creating Trolley batch:", error);
    throw error;
  }
}

export async function getTrolleyBatchStatus(batchId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-trolley-batch-status",
      {
        body: { batchId },
      },
    );

    if (error) throw error;
    return data as TrolleyBatch;
  } catch (error) {
    console.error("Error fetching Trolley batch status:", error);
    throw error;
  }
}

// Royalty Advance Types and Functions
export interface RoyaltyAdvance {
  id: string;
  amount: number;
  currency: string;
  advanceDate: string;
  repaidAmount: number;
  remainingBalance: number;
  status: "active" | "repaid" | "overdue";
  description?: string;
  repaymentHistory: RoyaltyRepayment[];
}

export interface RoyaltyRepayment {
  id: string;
  amount: number;
  date: string;
  payoutId?: string;
  balanceTransactionId?: string;
  description?: string;
}

export interface StripeBalanceTransaction {
  id: string;
  object: string;
  amount: number;
  available_on: number;
  created: number;
  currency: string;
  description: string | null;
  exchange_rate: number | null;
  fee: number;
  fee_details: any[];
  net: number;
  reporting_category: string;
  source: string;
  status: string;
  type: string;
}

export interface StripePayout {
  id: string;
  object: string;
  amount: number;
  arrival_date: number;
  automatic: boolean;
  balance_transaction: string;
  created: number;
  currency: string;
  description: string | null;
  destination: string;
  failure_balance_transaction: string | null;
  failure_code: string | null;
  failure_message: string | null;
  livemode: boolean;
  method: string;
  original_payout: string | null;
  reconciliation_status: string;
  reversed_by: string | null;
  source_type: string;
  statement_descriptor: string | null;
  status: string;
  type: string;
}

// Royalty Advance API Functions
export async function getRoyaltyAdvances() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-royalty-advances",
      {},
    );

    if (error) throw error;
    return data.advances as RoyaltyAdvance[];
  } catch (error) {
    console.error("Error fetching royalty advances:", error);
    return [];
  }
}

export async function getStripePayouts(params?: {
  status?: string;
  limit?: number;
  created?: { gte?: number; lte?: number };
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-stripe-payouts",
      {
        body: params || {},
      },
    );

    if (error) throw error;
    return data as { data: StripePayout[]; has_more: boolean };
  } catch (error) {
    console.error("Error fetching Stripe payouts:", error);
    return { data: [], has_more: false };
  }
}

export async function getStripeBalanceTransaction(transactionId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-stripe-balance-transaction",
      {
        body: { transactionId },
      },
    );

    if (error) throw error;
    return data as StripeBalanceTransaction;
  } catch (error) {
    console.error("Error fetching Stripe balance transaction:", error);
    throw error;
  }
}

export async function createRoyaltyAdvance(
  amount: number,
  currency: string = "USD",
  description?: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-royalty-advance",
      {
        body: { amount, currency, description },
      },
    );

    if (error) throw error;
    return data as RoyaltyAdvance;
  } catch (error) {
    console.error("Error creating royalty advance:", error);
    throw error;
  }
}

export async function recordRoyaltyRepayment(
  advanceId: string,
  amount: number,
  payoutId?: string,
  balanceTransactionId?: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-record-royalty-repayment",
      {
        body: { advanceId, amount, payoutId, balanceTransactionId },
      },
    );

    if (error) throw error;
    return data as RoyaltyRepayment;
  } catch (error) {
    console.error("Error recording royalty repayment:", error);
    throw error;
  }
}
