import { expect, test } from "@playwright/test";
import { AUTH0_LOGIN_URL, submitAuth0Form, testUser } from "./support/auth0";

test.describe("login", () => {
  test("shows a Log in link when signed out", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByText(/Signed in as/)).toHaveCount(0);
  });

  test("Log in redirects to the Auth0 login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Log in" }).click();

    await expect(page).toHaveURL(AUTH0_LOGIN_URL);
    await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  });

  // Keep wrong-password attempts to one per run: Auth0 brute-force protection
  // blocks the account after repeated failures.
  test("rejects a wrong password and stays on Auth0", async ({ page }) => {
    const user = testUser();

    await page.goto("/auth/login");
    await page.waitForURL(AUTH0_LOGIN_URL);
    await submitAuth0Form(page, user.email, "not-the-right-password");

    await expect(page.getByText("Wrong email or password")).toBeVisible();
    await expect(page).toHaveURL(AUTH0_LOGIN_URL);
  });

  test("signs in with valid credentials and returns to the app", async ({ page, baseURL }) => {
    const user = testUser();

    await page.goto("/");
    await page.getByRole("link", { name: "Log in" }).click();
    await page.waitForURL(AUTH0_LOGIN_URL);
    await submitAuth0Form(page, user.email, user.password);

    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();
    await expect(page.getByRole("link", { name: "Log out" })).toBeVisible();
  });
});
