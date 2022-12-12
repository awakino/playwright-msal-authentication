import { test, expect } from '@playwright/test';
import {decode, JwtPayload} from "jsonwebtoken";

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
        // auth config - alternatively this could be configured in playwright.config.ts to happen
        // for every test and any tests that require an unauthenticated context would need to do something
        // like this
        const context = await browser.newContext({
            storageState: "auth-storage-state.json"
        });

        // use this context to navigate to the page
        const page = await context.newPage();
        page.goto(url);

        // sign in button shouldn't exist
        await expect(page.getByRole("button", {name: "Sign In"})).toHaveCount(0);

        // get token button should exist
        const acquire = page.getByRole("button", {name: "Acquire Token"});
        await expect(acquire).toBeEnabled();

        // click the button
        acquire.click();

        // there should now be an access token element
        const token = page.getByTestId("access-token");
        await expect(token).toBeVisible();

        // we can decode the token if we want
        const parsed = decode(await token.innerText()) as JwtPayload;
         
        // expect it to have the MS Graph API as the audience
        expect(parsed.aud).toBe("00000003-0000-0000-c000-000000000000");

        // optionally display the acquired token
        // console.log(await token.innerText());
    });
});