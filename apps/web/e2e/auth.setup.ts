import { expect, test as setup } from "@playwright/test";
import { AUTH0_LOGIN_URL, authFile, submitAuth0Form, testUser } from "./support/auth0";

// Logs in once and saves the session cookies for the "logged-in" project.
setup("authenticate", async ({ page }) => {
  const user = testUser();

  await page.goto("/auth/login");
  await page.waitForURL(AUTH0_LOGIN_URL);
  await submitAuth0Form(page, user.email, user.password);

  // The session cookie is set during the callback redirect; wait until the app renders it.
  await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();

  await page.context().storageState({ path: authFile });
});
