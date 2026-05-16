"use client";

const CAPTURE_RETRY_DELAY_MS = 120;

function waitForCaptureTarget(captureTarget, attempt = 0) {
  const selector = `[data-tour-capture="${captureTarget}"]`;
  const element = document.querySelector(selector);

  if (element || attempt > 0) {
    return Promise.resolve(element);
  }

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(document.querySelector(selector));
    }, CAPTURE_RETRY_DELAY_MS);
  });
}

export async function captureTutorialTarget(captureTarget) {
  if (!captureTarget || typeof document === "undefined") {
    throw new Error("Tutorial capture target is unavailable.");
  }

  const element = await waitForCaptureTarget(captureTarget);

  if (!element) {
    throw new Error(`Tutorial capture target "${captureTarget}" was not found.`);
  }

  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    logging: false,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
  });

  return canvas.toDataURL("image/png");
}
