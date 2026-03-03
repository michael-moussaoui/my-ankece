const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// Set global options to use Node 20 features and performance
setGlobalOptions({ region: "us-central1" });

admin.initializeApp();

// Lazy load Stripe only when needed
let stripeInstance = null;
const getStripe = () => {
  if (!stripeInstance) {
    const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
    stripeInstance = require("stripe")(stripeKey);
  }
  return stripeInstance;
};

/**
 * Creates a Stripe Payment Intent for a subscription or one-time payment.
 * Expects { userId, priceId } in the request body.
 */
exports.createPaymentIntent = onRequest(async (req, res) => {
  // 1. Authenticate user (for v2 onRequest, we check the auth header manually or via middleware)
  // Note: For simplicity, assuming the client sends the userId. 
  // In a real app, verify the Firebase ID Token.
  
  const { userId, priceId } = req.body.data || req.body;

  if (!userId || !priceId) {
    res.status(400).send({ error: "Missing userId or priceId." });
    return;
  }

  try {
    const stripe = getStripe();
    
    // 2. Map priceId to actual amount (Example: 490 for 4.90€)
    let amount = 0;
    if (priceId === "price_elite_pro_test") {
      amount = 490;
    } else {
      res.status(400).send({ error: "Invalid priceId" });
      return;
    }

    // 3. Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    // 4. Return keys to the client
    res.send({
      data: {
        paymentIntentClientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
      }
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).send({ error: error.message });
  }
});
