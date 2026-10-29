import { expect, test } from "@playwright/test";
import { AUTH0_LOGIN_URL, AUTH0_SIGNUP_URL, submitAuth0Form, testUser } from "./support/auth0";

// These cases are rejected by Auth0 and create no accounts. A successful signup
// is not covered: it would add a real user to the tenant on every run.
test.describe("signup", () => {
  test("Sign up link on the login page opens the Auth0 signup form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForURL(AUTH0_LOGIN_URL);
    await page.getByRole("link", { name: "Sign up" }).click();

    await expect(page).toHaveURL(AUTH0_SIGNUP_URL);
    await expect(page).toHaveTitle(/^Sign up \|/);
  });

  test("screen_hint=signup opens the signup form directly", async ({ page }) => {
    await page.goto("/auth/login?screen_hint=signup");

    await expect(page).toHaveURL(AUTH0_SIGNUP_URL);
    await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  });

  test("rejects a password shorter than the tenant policy", async ({ page }) => {
    await page.goto("/auth/login?screen_hint=signup");
    await page.waitForURL(AUTH0_SIGNUP_URL);
    await submitAuth0Form(page, "e2e-weak-password@example.com", "abc");

    await expect(page.getByText("The password is too weak").first()).toBeVisible();
    await expect(page).toHaveURL(AUTH0_SIGNUP_URL);
  });

  test("does not create an account for an email that is already registered", async ({ page }) => {
    const user = testUser();

    await page.goto("/auth/login?screen_hint=signup");
    await page.waitForURL(AUTH0_SIGNUP_URL);
    await submitAuth0Form(page, user.email, "E2e-Strong-Passw0rd-For-Signup!");

    // Auth0 shows a generic error here on purpose, so it doesn't reveal which emails exist.
    await expect(page.getByRole("alert")).toContainText("Something went wrong");
    await expect(page).toHaveURL(AUTH0_SIGNUP_URL);
  });
});
