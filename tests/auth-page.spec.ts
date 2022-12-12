import { test, expect } from '@playwright/test';

const url = process.env.TEST_ENVIRONMENT_URL || "http://localhost:5174";

test.describe("Unauthenticated Tests", () => {
    test("verify unauthenticated page", async ({page}) => {
        await page.goto(url);

        // look for the sign in button
        const signin = page.getByRole("button", {name: "Sign In"});
        await expect(signin).toBeEnabled();

        // there shouldn't be a button to acquire a token
        const acquire = page.getByRole("button", {name: "Acquire Token"});
        await expect(acquire).toHaveCount(0);
    });
});

test.describe("Authenticated Tests", () => {
    test("verify authenticated behviour", async ({browser}) => {
        // we need a new context so we can initialise it with the stored
        // auth config
        const context = await browser.newContext({
            storageState: "auth-storage-state.json"
        });

        // use this context to navigate to the page
        const page = await context.newPage();
        page.goto(url);
    });
});