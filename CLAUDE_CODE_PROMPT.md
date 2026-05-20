# How to use Claude Code for this assessment

This file gives you everything you need to drive the build with Claude Code in VS Code: the install/setup steps, the master prompt, and a few follow-up prompts for iteration.

---

## 1. Install Claude Code in VS Code

1. Install the **Claude Code** extension from the VS Code marketplace.
2. Sign in to your Anthropic account.
3. Open the project folder (`stripe-payment-e2e/`) in VS Code.
4. Claude will automatically pick up `CLAUDE.md` at the repo root and use it as context for every prompt.

---

## 2. Master prompt (paste this first)

Open Claude Code's chat panel in VS Code, paste the prompt below, and let it run end-to-end.

```
You are working in the stripe-payment-e2e repo. Read CLAUDE.md at the repo root before doing anything — it contains the architectural rules, locator strategy, BDD style, and the strict patterns this project follows.

Then audit and finalise the project to make it submission-ready for a Principal QA Automation Engineer assessment. Specifically:

1. Read the existing files in /src, /tests, /data, /.github/workflows, and the config files. Confirm each one already follows the CLAUDE.md rules — no waitForTimeout, no raw CSS selectors, JSDoc + @ts-check on every public method, no hardcoded test data in specs.

2. Run `npm install` and `npx playwright install --with-deps chromium`. Report any install errors.

3. Run `npm run typecheck` and fix every reported error without weakening the JSDoc types.

4. Verify the test design covers ALL of these endpoints with at least one happy-path and (where applicable) one negative case:
   - POST /payment_methods
   - POST /payment_intents (create)
   - POST /payment_intents/:id/confirm
   - GET /payment_intents/:id
   - GET /payment_intents (list)
   - POST /refunds (full + partial)
   - GET /refunds/:id
   - GET /refunds (list)
   - GET /events (used as the webhook verification mechanism)
   For any gap, add a test in the appropriate file under /tests/api following the Given/When/Then describe pattern.

5. Verify the E2E spec (tests/e2e/full-payment-journey.spec.js) walks the full journey: create → confirm → verify webhook → refund → verify webhook → open dashboard → assert amount + status + refund visibility.

6. Confirm tests/auth.setup.js correctly persists storage state to auth/dashboard.json, and that both 'ui' and 'e2e' Playwright projects depend on 'setup'.

7. Confirm .github/workflows/playwright.yml:
   - Runs on push and pull_request
   - Installs deps + chromium
   - Runs tests with continue-on-error so the report always uploads
   - Generates Allure HTML and uploads it as an artifact
   - Deploys the Allure HTML to GitHub Pages on main
   - Caches Allure history across runs

8. Run `npm test` locally and report which tests pass / fail. For any failing test, diagnose root cause and fix without weakening assertions or adding hard sleeps.

9. Generate the Allure report locally (`npm run report:generate`) and confirm allure-report/index.html is produced.

10. Print a final checklist of what's done, what's left, and any assumptions you needed to make. Surface those assumptions clearly — the candidate is required to communicate them to the client alongside the solution.

Rules:
- Do not use TypeScript. JavaScript with JSDoc + @ts-check only.
- Do not add waitForTimeout anywhere.
- Do not use raw CSS or XPath selectors.
- Do not invent new top-level folders.
- Do not add the `stripe` npm package — use Playwright's request context against the REST API directly.
- If anything is ambiguous, ASK before making a destructive change.
```

---

## 3. Follow-up prompts to keep handy

Use these once the master prompt completes. Paste them one at a time as you need them.

### Add a new test card scenario

```
Add a new entry to data/test-cards.json for the "3D Secure 2 — required" test card (4000002760003220). Then add a test in tests/api/payment-intent.spec.js that:

- Creates a PaymentIntent for $50 USD
- Confirms it with this card
- Asserts the response status returns `requires_action` and the `next_action.type` is `use_stripe_sdk` or `redirect_to_url`

Follow the existing Given/When/Then describe pattern. Do not introduce hardcoded values — load card data via loadTestCards() and amount via loadTestAmounts().
```

### Improve a flaky test

```
The test "[test name]" failed once with a webhook timeout. Read its current implementation, identify why it might be flaky, and refactor it using WebhookVerifier with an explicit timeout and clear error message. Do not add waitForTimeout.
```

### Add a new dashboard verification

```
Add a UI verification that confirms the customer's email (from PaymentIntent metadata or charge billing details) is visible on the payment detail page. Update PaymentDetailPage with a new locator (using getByRole/getByLabel/getByText only) and a new assertion method `assertCustomerEmailVisible(email)`. Then add a spec in tests/ui/ that exercises it.
```

### Wire up an additional Stripe endpoint

```
Add support for the Disputes endpoint:

1. Add `listDisputes(query)` and `retrieveDispute(disputeId)` methods on StripeApiClient with full JSDoc types.
2. Add a happy-path API spec under tests/api/dispute.spec.js that lists disputes for the test account (test mode will return an empty list — assert status 200 and that data is an array).
3. Document the new endpoint in the coverage matrix table in README.md.
```

### Debug a failing CI run

```
The latest GitHub Actions run failed at the "Run Playwright tests" step. Read the workflow logs (I'll paste them), identify the root cause, and propose the minimal fix. If the issue is missing secrets, list which secrets need to be added in the repo settings.
```

---

## 4. Tips for getting the best out of Claude Code on this project

- **Reference files explicitly.** Say "look at `src/api/StripeApiClient.js`" rather than "look at the API client" — Claude resolves paths faster.
- **Run the typechecker after every significant change.** `npm run typecheck`. Don't let JSDoc rot.
- **Use Allure's step API** for multi-action flows so your report tells a story:
  ```js
  await test.step('Create and confirm payment', async () => { ... });
  await test.step('Issue full refund', async () => { ... });
  ```
- **Don't let Claude introduce TypeScript.** If you see `.ts` files appearing, stop and remind it that the assessment specifies JavaScript.
- **Don't let Claude add `waitForTimeout`** even if a test is flaky. Flakiness is a signal of a real issue (timing, polling, locator strategy) — fix the underlying cause.
