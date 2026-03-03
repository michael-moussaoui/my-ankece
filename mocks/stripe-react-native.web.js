/**
 * Web stub for @stripe/stripe-react-native
 * Metro redirects imports of this module to here when bundling for web.
 */
const React = require('react');

// StripeProvider is a no-op wrapper on web
const StripeProvider = ({ children }) => children;

module.exports = {
  StripeProvider,
  useStripe: () => ({}),
  usePaymentSheet: () => ({ initPaymentSheet: async () => ({}), presentPaymentSheet: async () => ({}) }),
  initStripe: async () => {},
};
