import { expect, type Page, test } from "@playwright/test";

async function contrastRatio(
  page: Page,
  foregroundSelector: string,
  backgroundSelector: string,
  pseudoElement?: string,
) {
  return page
    .locator(foregroundSelector)
    .first()
    .evaluate(
      (foreground, { backgroundSelector, pseudoElement }) => {
        const toLuminance = (color: string) => {
          const channels = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3);
          if (channels?.length !== 3) {
            throw new Error(`Unsupported color: ${color}`);
          }
          const [red = 0, green = 0, blue = 0] = channels
            .map(Number)
            .map((channel) => {
              const normalized = channel / 255;
              return normalized <= 0.04045
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4;
            });
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };

        const background = document.querySelector(backgroundSelector);
        if (!background) {
          throw new Error(`Missing background: ${backgroundSelector}`);
        }
        const foregroundLuminance = toLuminance(
          getComputedStyle(foreground, pseudoElement).color,
        );
        const backgroundLuminance = toLuminance(
          getComputedStyle(background).backgroundColor,
        );
        return (
          (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
          (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
        );
      },
      { backgroundSelector, pseudoElement },
    );
}

test("console exposes the active section and opens the delivery queue directly", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("button", { name: "View queue" }).click();

  await expect(page.getByRole("heading", { name: "Delivery" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delivery" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("confirmation dialogs contain focus and restore it on cancellation", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Send test" });
  await trigger.click();

  const dialog = page.getByRole("dialog", {
    name: "Send fixed test message",
  });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const confirm = dialog.getByRole("button", { name: "Confirm" });

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute(
    "aria-describedby",
    "confirmation-detail",
  );
  await expect(cancel).toBeFocused();
  await expect(page.locator(".console-shell")).toHaveAttribute("inert", "");

  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("compact console text meets the AA contrast floor", async ({ page }) => {
  await page.goto("/");

  await expect(contrastRatio(page, "th", "th")).resolves.toBeGreaterThanOrEqual(
    4.5,
  );
  await expect(
    contrastRatio(
      page,
      ".table-wrap td span:not(.outcome):not(.status)",
      ".table-wrap",
    ),
  ).resolves.toBeGreaterThanOrEqual(4.5);
  await expect(
    contrastRatio(
      page,
      ".inline-form input",
      ".inline-form input",
      "::placeholder",
    ),
  ).resolves.toBeGreaterThanOrEqual(4.5);
});

test("delivery tables keep content within the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Delivery" }).click();

  const tableContentOverflows = await page
    .locator(".table-wrap")
    .evaluateAll((wrappers) =>
      wrappers.some((wrapper) => {
        const bounds = wrapper.getBoundingClientRect();
        return Array.from(wrapper.querySelectorAll<HTMLElement>("td *")).some(
          (element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
          },
        );
      }),
    );

  expect(tableContentOverflows).toBe(false);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});
