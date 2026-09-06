import { expect, test } from "@playwright/test";

// Smoke = "publicou sem quebrar". Roda contra BASE_URL depois de cada deploy.
// STORE_NAME e PRODUCT_SLUG existem pra reaproveitar o mesmo teste em outra
// loja quando a plataforma tiver mais de um tenant.
const STORE_NAME = process.env.STORE_NAME ?? "Juliana Cestas";
const PRODUCT_SLUG = process.env.PRODUCT_SLUG ?? "cesta-memoravel";

test("home responde e mostra o nome da loja", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByText(STORE_NAME).first()).toBeVisible();
});

test("página de produto responde", async ({ page }) => {
  const response = await page.goto(`/produto/${PRODUCT_SLUG}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("/admin sem sessão vai pro login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("API de horários de entrega responde sem erro de servidor", async ({ request }) => {
  const response = await request.get("/api/checkout/slots");
  expect(response.status()).toBeLessThan(500);
});
