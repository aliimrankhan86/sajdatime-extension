import { expect, test } from '@playwright/test';
import { launchExtension, seedSettings, type Extension } from './extension';

/**
 * `chrome.action.openPopup()` is the real check, but under Playwright's headless
 * Chrome it resolves without opening a page the harness can measure. So this test
 * reproduces the bug's root cause instead: the real popup sizes itself to the
 * document's intrinsic width, which is exactly what setting the html element to
 * `width: fit-content` simulates. The body must stay 380px wide on its own.
 */
test('the popup body stays 380px wide even when the document is sized to its content', async () => {
  const extension: Extension = await launchExtension();
  try {
    await seedSettings(extension);

    const bodyWidth = await extension.page.evaluate(() => {
      const html = document.documentElement;
      html.style.width = 'fit-content';
      html.style.maxWidth = 'none';
      return document.body.getBoundingClientRect().width;
    });

    expect(bodyWidth).toBe(380);
  } finally {
    await extension.close();
  }
});
