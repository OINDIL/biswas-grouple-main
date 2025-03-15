"use server";
import { client } from "@/lib/prisma";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { onAuthenticatedUser } from "./auth";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
  apiVersion: "2024-06-20",
  appInfo: {
    name: "Biswas Grouple",
    version: "1.0.0"
  }
});

// Verify Stripe configuration
const verifyStripeConfig = async () => {
  try {
    // Test the API key by making a simple request
    await stripe.paymentMethods.list({ limit: 1 });
    console.log("Stripe configuration verified successfully");
    return true;
  } catch (error) {
    console.error("Stripe configuration error:", error);
    return false;
  }
};

// Verify Stripe configuration on startup
verifyStripeConfig().catch(console.error);

// Initialize Razorpay with validation
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay credentials are not configured in environment variables");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Verify Razorpay configuration
const verifyRazorpayConfig = async () => {
  try {
    // Test the configuration by creating a small test order
    const testOrder = await razorpay.orders.create({
      amount: 100, // Minimum amount (1 INR)
      currency: "INR",
      receipt: "test_" + Date.now(),
    });
    
    if (testOrder && testOrder.id) {
      console.log("Razorpay configuration verified successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Razorpay configuration error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return false;
  }
};

// Verify Razorpay configuration on startup
verifyRazorpayConfig().catch(console.error);

export const onGetRazorpayClientSecret = async (amount: number) => {
  try {
    if (!amount || amount <= 0) {
      console.error("Invalid amount:", amount);
      return { status: 400, message: "Invalid payment amount" };
    }

    // Verify Razorpay configuration before proceeding
    const isConfigValid = await verifyRazorpayConfig();
    if (!isConfigValid) {
      return { status: 500, message: "Payment service configuration error" };
    }

    // Create order with idempotency
    const receipt = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
      currency: "INR",
      receipt,
      notes: {
        type: 'group_subscription',
        created_at: new Date().toISOString()
      }
    });

    if (!order || !order.id) {
      console.error("Failed to create Razorpay order");
      return { status: 400, message: "Failed to create payment order" };
    }

    console.log("Razorpay order created successfully:", {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

    return { 
      status: 200, 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error("Razorpay Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create Razorpay order";
    return { 
      status: 400, 
      message: errorMessage
    };
  }
};

export const onVerifyRazorpayPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
) => {
  try {
    const text = orderId + "|" + paymentId;
    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(text)
      .digest('hex');

    if (generated_signature === signature) {
      return { 
        status: 200, 
        message: "Payment verified successfully" 
      };
    }
    
    return { 
      status: 400, 
      message: "Payment verification failed" 
    };
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    return { 
      status: 400, 
      message: "Payment verification failed" 
    };
  }
};

export const onGetStripeClientSecret = async (amount: number) => {
  try {
    if (!amount || amount <= 0) {
      console.error("Invalid amount:", amount);
      return { status: 400, message: "Invalid payment amount" };
    }

    // Verify Stripe configuration before proceeding
    const isConfigValid = await verifyStripeConfig();
    if (!isConfigValid) {
      return { status: 500, message: "Payment service configuration error" };
    }

    // Create the payment intent with idempotency key to prevent duplicates
    const idempotencyKey = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: Math.round(amount * 100), // Convert to cents and ensure integer
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        integration_check: 'accept_a_payment',
        type: 'group_subscription',
        created_at: new Date().toISOString()
      },
      description: "Group Subscription Payment",
      statement_descriptor: "BISWAS GROUPLE",
      statement_descriptor_suffix: "SUB",
      setup_future_usage: 'off_session', // Allow future payments
      confirm: false, // Don't confirm automatically
    }, {
      idempotencyKey
    });

    if (!paymentIntent || !paymentIntent.client_secret) {
      console.error("Failed to create payment intent");
      return { status: 400, message: "Failed to create payment intent" };
    }

    // Store the payment intent ID for verification
    console.log("Payment intent created successfully:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret.split('_secret_')[0] // Log only the public part
    });

    return { 
      status: 200, 
      secret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id // Include the ID in the response
    };
  } catch (error) {
    console.error("Stripe Error:", error);
    if (error instanceof Stripe.errors.StripeError) {
      const errorMessage = error.message || "Failed to create Stripe payment";
      console.error("Stripe Error Details:", {
        type: error.type,
        code: error.code,
        param: error.param,
      });
      return { 
        status: error.statusCode || 400, 
        message: errorMessage
      };
    }
    return { status: 400, message: "Failed to create Stripe payment" };
  }
};

// Add a new function to verify payment intent status
export const verifyPaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: 200,
      paymentStatus: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    };
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return { status: 400, message: "Failed to verify payment" };
  }
};

export const onTransferCommission = async (
  amount: number,
  destination: string
) => {
  try {
    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: "usd",
      destination: destination,
    });

    return { status: 200, transfer };
  } catch (error) {
    console.error("Stripe Transfer Error:", error);
    return { status: 400, message: "Transfer failed" };
  }
};

export const onGetActiveSubscription = async (groupId: string) => {
  try {
    const subscription = await client.subscription.findFirst({
      where: { groupId, active: true },
    });

    return subscription
      ? { status: 200, subscription }
      : { status: 404, message: "No active subscription found" };
  } catch (error) {
    console.error("Subscription Fetch Error:", error);
    return { status: 400, message: "Failed to fetch subscription" };
  }
};

export const onGetSubscriptionPaymentIntent = async (
  groupId: string,
  method: "stripe" | "razorpay" = "stripe"
) => {
  try {
    const price = await client.subscription.findFirst({
      where: { groupId, active: true },
      select: { price: true },
    });

    if (!price) return { status: 400, message: "No active subscription found" };

    if (method === "stripe") {
      return await onGetStripeClientSecret(price.price ?? 0);
    } else if (method === "razorpay") {
      return await onGetRazorpayClientSecret(price.price ?? 0);
    }
  } catch (error) {
    console.error("Payment Intent Error:", error);
    return { status: 400, message: "Failed to load form" };
  }
};

export const onCreateNewGroupSubscription = async (
  groupId: string,
  price: number
) => {
  try {
    const subscription = await client.group.update({
      where: { id: groupId },
      data: {
        subscription: {
          create: { price },
        },
      },
    });

    return { status: 200, message: "Subscription created", subscription };
  } catch (error) {
    console.error("Subscription Creation Error:", error);
    return { status: 400, message: "Failed to create subscription" };
  }
};

export const onActivateSubscription = async (id: string) => {
  try {
    const status = await client.subscription.findUnique({
      where: { id },
      select: { active: true },
    });

    if (!status) return { status: 404, message: "Subscription not found" };

    if (status.active) {
      return { status: 200, message: "Plan already active" };
    }

    const current = await client.subscription.findFirst({
      where: { active: true },
      select: { id: true },
    });

    if (current) {
      await client.subscription.update({
        where: { id: current.id },
        data: { active: false },
      });
    }

    await client.subscription.update({
      where: { id },
      data: { active: true },
    });

    return { status: 200, message: "New plan activated" };
  } catch (error) {
    console.error("Subscription Activation Error:", error);
    return { status: 400, message: "Failed to activate subscription" };
  }
};

export const onGetStripeIntegration = async () => {
  try {
    const authResponse = await onAuthenticatedUser();
    if (authResponse.status !== 200 || !authResponse.id) {
      return { 
        status: authResponse.status, 
        message: authResponse.message || "Authentication failed" 
      };
    }

    const stripeId = await client.user.findUnique({
      where: { id: authResponse.id },
      select: { stripeId: true },
    });

    return stripeId?.stripeId 
      ? { status: 200, stripeId: stripeId.stripeId }
      : { status: 404, message: "No Stripe integration found" };
  } catch (error) {
    console.error("Stripe Integration Error:", error);
    return { 
      status: 400, 
      message: error instanceof Error ? error.message : "Failed to get Stripe integration" 
    };
  }
};

export const onGetRazorpayIntegration = async () => {
  try {
    const authResponse = await onAuthenticatedUser();
    if (authResponse.status !== 200 || !authResponse.id) {
      return { 
        status: authResponse.status, 
        message: authResponse.message || "Authentication failed" 
      };
    }

    const user = await client.user.findUnique({
      where: { id: authResponse.id },
      select: { razorpayId: true },
    });

    return user?.razorpayId 
      ? { status: 200, razorpayId: user.razorpayId }
      : { status: 404, message: "No Razorpay integration found" };
  } catch (error) {
    console.error("Razorpay Integration Error:", error);
    return { 
      status: 400, 
      message: error instanceof Error ? error.message : "Failed to get Razorpay integration" 
    };
  }
};
