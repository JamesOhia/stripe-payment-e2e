// @ts-check
import { test, expect } from '../../src/fixtures/playwright-fixtures.js';
import { loadTestAmounts, loadTestCards } from '../../src/utils/data-loader.js';

const amounts = loadTestAmounts();
const cards = loadTestCards();

test.describe('Stripe Dashboard UI — payment list verification', () => {
  test.describe('Given a payment exists in the account', () => {
    test('When the payments list loads, Then the payment is searchable by ID', async ({
      stripeApi,
      paymentsPage,
    }) => {
      // Create a known-good payment via API to set up the UI assertion.
      const pm = await stripeApi.createCardPaymentMethod(cards.success);
      const intent = await stripeApi.createPaymentIntent({
        amount: amounts.small.amount,
        currency: amounts.small.currency,
      });
      const intentId = /** @type {any} */ (intent.body).id;
      const pmId = /** @type {any} */ (pm.body).id;
      await stripeApi.confirmPaymentIntent(intentId, pmId);

      // The setup project already authenticated us; storage state is loaded.
      // Navigate via the page object.
      const detail = await paymentsPage.openPaymentById(intentId);
      await detail.assertLoaded();
      await detail.assertAmountIs(amounts.small.display);
      await detail.assertStatusIs('Succeeded');
    });
  });
});
