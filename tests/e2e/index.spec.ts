import { test, expect } from '@playwright/test';

test.describe('TransitOps End-to-End Tests', () => {
    test('should load the homepage', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle(/TransitOps/);
    });

    test('should navigate to the login page', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.click('text=Login');
        await expect(page).toHaveURL(/.*login/);
    });

    test('should log in with valid credentials', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="username"]', 'testuser');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should display error on invalid login', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="username"]', 'invaliduser');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await expect(page.locator('.error-message')).toHaveText('Invalid username or password');
    });

    test('should log out successfully', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');
        await page.click('text=Logout');
        await expect(page).toHaveURL(/.*login/);
    });
});