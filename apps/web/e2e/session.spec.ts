import { expect, test } from "@playwright/test";
import { testUser } from "./support/auth0";

// Runs with the session saved by auth.setup.ts.
test.describe("signed-in session", () => {
  test("stays signed in after a reload", async ({ page }) => {
    const user = testUser();

    await page.goto("/");
    await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();

    await page.reload();
    await expect(page.getByText(`Signed in as ${user.email}`)).toBeVisible();
  });

  test("Log out returns to the signed-out state", async ({ page, baseURL }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Log out" }).click();

    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByText(/Signed in as/)).toHaveCount(0);
  });
});
