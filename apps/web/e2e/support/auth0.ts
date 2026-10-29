import path from "node:path";
import { expect, type Page } from "@playwright/test";

/** Saved session for the "logged-in" project. Contains a live session cookie; git-ignored. */
export const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

export interface TestUser {
  email: string;
  password: string;
}

/** Reads the dedicated dev-tenant test user; never use a personal account. */
export function testUser(): TestUser {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD in apps/web/.env.local (see .env.example).",
    );
  }
  return { email, password };
}

/** Matches Auth0 Universal Login pages on any tenant domain. */
export const AUTH0_LOGIN_URL = /\/u\/login/;
export const AUTH0_SIGNUP_URL = /\/u\/signup/;

/** Fills and submits the Auth0 Universal Login (or signup) form. */
export async function submitAuth0Form(page: Page, email: string, password: string) {
  const emailBox = page.getByRole("textbox", { name: "Email address" });
  // Role + name avoids also matching the "Show password" switch.
  const passwordBox = page.getByRole("textbox", { name: "Password" });

  // On a cold load, Auth0's script can autofocus the email box while the password
  // is being typed, so the password lands in the wrong field. Refill until both
  // fields hold the intended values. The password is only checked for non-emptiness
  // so a failure message never prints it.
  await expect(async () => {
    await emailBox.fill(email);
    await passwordBox.fill(password);
    await expect(emailBox).toHaveValue(email, { timeout: 1_000 });
    await expect(passwordBox).not.toHaveValue("", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
