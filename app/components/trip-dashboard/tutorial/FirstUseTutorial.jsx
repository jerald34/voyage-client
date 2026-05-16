"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { homeTourSteps } from "./tutorialContent.js";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const VIEWPORT_PADDING = 16;
const CARD_WIDTH = 370;
const CARD_GAP = 18;
const ESTIMATED_CARD_HEIGHT = 310;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getTargetSelector(target) {
  return `[data-tour-target="${target}"]`;
}

function getPrefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function getCompactViewport() {
  return window.matchMedia?.("(max-width: 760px)")?.matches ?? window.innerWidth <= 760;
}

function getCoachPosition(rect, placement, isCompact) {
  if (isCompact) {
    return {
      left: VIEWPORT_PADDING,
      right: VIEWPORT_PADDING,
      bottom: VIEWPORT_PADDING,
    };
  }

  const viewportWidth = window.innerWidth || 1024;
  const viewportHeight = window.innerHeight || 768;
  const width = Math.min(CARD_WIDTH, viewportWidth - VIEWPORT_PADDING * 2);
  const fallbackRect = {
    top: viewportHeight / 2 - 80,
    left: viewportWidth / 2 - 80,
    width: 160,
    height: 160,
  };
  const targetRect = rect ?? fallbackRect;
  const centeredLeft = targetRect.left + targetRect.width / 2 - width / 2;
  const centeredTop = targetRect.top + targetRect.height / 2 - ESTIMATED_CARD_HEIGHT / 2;

  let left = centeredLeft;
  let top = targetRect.top + targetRect.height + CARD_GAP;

  if (placement === "top") {
    top = targetRect.top - ESTIMATED_CARD_HEIGHT - CARD_GAP;
  } else if (placement === "right") {
    left = targetRect.left + targetRect.width + CARD_GAP;
    top = centeredTop;
  } else if (placement === "left") {
    left = targetRect.left - width - CARD_GAP;
    top = centeredTop;
  }

  if (left + width > viewportWidth - VIEWPORT_PADDING) {
    left = targetRect.left - width - CARD_GAP;
  }

  if (left < VIEWPORT_PADDING) {
    left = targetRect.left + targetRect.width + CARD_GAP;
  }

  if (left + width > viewportWidth - VIEWPORT_PADDING || left < VIEWPORT_PADDING) {
    left = centeredLeft;
  }

  if (top + ESTIMATED_CARD_HEIGHT > viewportHeight - VIEWPORT_PADDING) {
    top = targetRect.top - ESTIMATED_CARD_HEIGHT - CARD_GAP;
  }

  if (top < VIEWPORT_PADDING) {
    top = targetRect.top + targetRect.height + CARD_GAP;
  }

  return {
    left: clamp(left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING)),
    top: clamp(top, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, viewportHeight - ESTIMATED_CARD_HEIGHT - VIEWPORT_PADDING)),
    width,
  };
}

function TutorialProgress({ activeIndex }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {homeTourSteps.map((step, index) => (
        <span
          key={step.id}
          className={[
            "h-1.5 rounded-full transition-all",
            index === activeIndex ? "w-7 bg-secondary" : "w-2 bg-white/25",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function TutorialBackdrop({ onClose, spotlightStyle }) {
  if (spotlightStyle?.display === "none") {
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close tutorial backdrop"
        className="absolute inset-0 bg-slate-950/62 backdrop-blur-[2px]"
        onClick={onClose}
      />
    );
  }

  const top = Number(spotlightStyle.top) || 0;
  const left = Number(spotlightStyle.left) || 0;
  const width = Number(spotlightStyle.width) || 0;
  const height = Number(spotlightStyle.height) || 0;
  const bottomTop = top + height;
  const rightLeft = left + width;
  const segmentClass = "absolute bg-slate-950/62 backdrop-blur-[2px]";

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close tutorial backdrop"
        className={segmentClass}
        style={{ top: 0, left: 0, right: 0, height: top }}
        onClick={onClose}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close tutorial backdrop"
        className={segmentClass}
        style={{ top, left: 0, width: left, height }}
        onClick={onClose}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close tutorial backdrop"
        className={segmentClass}
        style={{ top, left: rightLeft, right: 0, height }}
        onClick={onClose}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close tutorial backdrop"
        className={segmentClass}
        style={{ top: bottomTop, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      />
    </>
  );
}

export default function FirstUseTutorial({ open, onClose, onStepChange }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isCompact, setIsCompact] = useState(false);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const activeStep = homeTourSteps[activeIndex] ?? homeTourSteps[0];
  const isLastStep = activeIndex === homeTourSteps.length - 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveIndex(0);
    setIsCompact(getCompactViewport());
  }, [open]);

  useEffect(() => {
    if (!open || !activeStep) {
      return;
    }

    onStepChange?.(activeStep);
  }, [activeStep, onStepChange, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    window.setTimeout(() => {
      const dialog = dialogRef.current;
      const firstFocusable = dialog?.querySelector(FOCUSABLE_SELECTOR);
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus();
      } else {
        dialog?.focus();
      }
    }, 0);

    return () => {
      const previousFocus = previousFocusRef.current;
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) {
        previousFocus.focus();
      }
      previousFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (element) => element instanceof HTMLElement && !element.hasAttribute("disabled"),
      );

      if (!focusableElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !activeStep?.target) {
      return undefined;
    }

    let frameId = 0;
    let scrollSettleTimer = 0;
    const targetElement = document.querySelector(getTargetSelector(activeStep.target));

    const updateTargetRect = () => {
      if (!(targetElement instanceof HTMLElement)) {
        setTargetRect(null);
        return;
      }

      const nextRect = targetElement.getBoundingClientRect();
      setTargetRect({
        top: nextRect.top,
        left: nextRect.left,
        width: nextRect.width,
        height: nextRect.height,
      });
      setIsCompact(getCompactViewport());
    };

    if (targetElement instanceof HTMLElement) {
      targetElement.scrollIntoView?.({
        block: "center",
        inline: "center",
        behavior: getPrefersReducedMotion() ? "auto" : "smooth",
      });
    }

    const requestRectUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateTargetRect);
    };

    scrollSettleTimer = window.setTimeout(requestRectUpdate, 90);
    requestRectUpdate();

    window.addEventListener("resize", requestRectUpdate);
    window.addEventListener("scroll", requestRectUpdate, true);

    return () => {
      window.clearTimeout(scrollSettleTimer);
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", requestRectUpdate);
      window.removeEventListener("scroll", requestRectUpdate, true);
    };
  }, [activeStep, open]);

  const coachStyle = useMemo(() => {
    if (!open || !activeStep) {
      return {};
    }

    return getCoachPosition(targetRect, activeStep.placement, isCompact);
  }, [activeStep, isCompact, open, targetRect]);

  const spotlightStyle = useMemo(() => {
    if (!targetRect) {
      return {
        display: "none",
      };
    }

    const inset = isCompact ? 4 : 8;
    return {
      top: Math.max(8, targetRect.top - inset),
      left: Math.max(8, targetRect.left - inset),
      width: Math.max(44, targetRect.width + inset * 2),
      height: Math.max(44, targetRect.height + inset * 2),
    };
  }, [isCompact, targetRect]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!open || !activeStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[180]">
      <TutorialBackdrop onClose={handleClose} spotlightStyle={spotlightStyle} />

      <div
        className="pointer-events-none fixed rounded-[22px] border-2 border-secondary bg-transparent shadow-[0_0_0_8px_rgba(215,122,97,0.16),0_18px_46px_rgba(0,0,0,0.28)] transition-all duration-200"
        data-tour-spotlight={activeStep.target}
        style={spotlightStyle}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-use-tutorial-title"
        aria-describedby="first-use-tutorial-description"
        tabIndex={-1}
        className="fixed z-10 max-h-[calc(100vh-32px)] overflow-y-auto rounded-[22px] border border-white/12 bg-[#0b171e] p-4 text-white shadow-[0_24px_80px_rgba(2,8,23,0.5)] outline-none max-[760px]:rounded-[24px] max-[760px]:p-4"
        style={coachStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/90">
              Step {activeIndex + 1} of {homeTourSteps.length}
            </p>
            <h2 id="first-use-tutorial-title" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">
              First-use tutorial
            </h2>
          </div>
          <TutorialProgress activeIndex={activeIndex} />
        </div>

        <h3 className="mt-4 text-lg font-semibold leading-6 tracking-[-0.01em] text-white">
          {activeStep.title}
        </h3>
        <p id="first-use-tutorial-description" className="mt-2 text-sm leading-6 text-white/70">
          {activeStep.description}
        </p>

        <ul className="mt-4 space-y-2">
          {activeStep.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-sm leading-6 text-white/72">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="min-h-11 rounded-pill border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            onClick={handleClose}
          >
            Skip tutorial
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="min-h-11 rounded-pill border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
              disabled={activeIndex === 0}
            >
              Back
            </button>
            {isLastStep ? (
              <button
                type="button"
                className="min-h-11 rounded-pill bg-secondary px-5 text-sm font-semibold text-white transition hover:brightness-110"
                onClick={handleClose}
              >
                Finish tutorial
              </button>
            ) : (
              <button
                type="button"
                className="min-h-11 rounded-pill bg-secondary px-5 text-sm font-semibold text-white transition hover:brightness-110"
                onClick={() => setActiveIndex((current) => Math.min(current + 1, homeTourSteps.length - 1))}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
