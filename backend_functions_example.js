/**
 * Exemple de fonctions Firebase pour Stripe
 * À placer dans votre dossier functions/index.js
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')('VOTRE_STRIPE_SECRET_KEY');

admin.initializeApp();

exports.createStripeSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { priceId } = data;
  const customerId = context.auth.token.stripeCustomerId || await createStripeCustomer(context.auth.uid);

  try {
    // Créer un Payment Intent ou une Subscription
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2022-11-15' }
    );

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      subscriptionId: subscription.id,
      paymentIntent: subscription.latest_invoice.payment_intent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Webhook pour synchroniser Firestore quand le paiement réussit
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, 'VOTRE_WEBHOOK_SECRET');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    
    // Trouver l'utilisateur et mettre à jour son plan
    const userSnapshot = await admin.firestore().collection('users')
      .where('stripeCustomerId', '==', customerId).limit(1).get();
    
    if (!userSnapshot.empty) {
      const userRef = userSnapshot.docs[0].ref;
      await userRef.update({
        plan: 'elite-pro',
        subscriptionStatus: subscription.status,
        currentPeriodEnd: subscription.current_period_end * 1000,
      });
    }
  }

  res.json({ received: true });
});

async function createStripeCustomer(uid) {
  const user = await admin.auth().getUser(uid);
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { firebaseUID: uid }
  });
  
  await admin.firestore().collection('users').doc(uid).update({
    stripeCustomerId: customer.id
  });
  
  return customer.id;
}
