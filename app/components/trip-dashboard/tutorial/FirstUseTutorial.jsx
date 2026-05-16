"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { homeTourSteps } from "./tutorialContent.js";

function TutorialStepDot({ active }) {
  return (
    <span
      className={[
        "h-2.5 w-2.5 rounded-full transition-all",
        active ? "bg-secondary shadow-[0_0_0_6px_rgba(215,122,97,0.14)]" : "bg-white/25",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

export default function FirstUseTutorial({ open, onClose, getCapture }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [captures, setCaptures] = useState({});
  const captureRequestsRef = useRef(new Set());

  useEffect(() => {
    if (!open) {
      captureRequestsRef.current = new Set();
      return;
    }
    setActiveIndex(0);
    setCaptures({});
  }, [open]);

  const activeStep = homeTourSteps[activeIndex] ?? homeTourSteps[0];
  const activeCapture = captures[activeStep.id];
  const progress = useMemo(() => {
    if (!homeTourSteps.length) return 0;
    return Math.round(((activeIndex + 1) / homeTourSteps.length) * 100);
  }, [activeIndex]);

  useEffect(() => {
    if (!open || !activeStep?.captureTarget || typeof getCapture !== "function") return;

    if (captureRequestsRef.current.has(activeStep.id)) return;
    captureRequestsRef.current.add(activeStep.id);

    let cancelled = false;

    setCaptures((current) => ({
      ...current,
      [activeStep.id]: { status: "capturing", src: "", error: "" },
    }));

    getCapture(activeStep.captureTarget)
      .then((src) => {
        if (cancelled) {
          captureRequestsRef.current.delete(activeStep.id);
          return;
        }
        setCaptures((current) => ({
          ...current,
          [activeStep.id]: { status: "ready", src, error: "" },
        }));
      })
      .catch((error) => {
        captureRequestsRef.current.delete(activeStep.id);
        if (cancelled) return;
        setCaptures((current) => ({
          ...current,
          [activeStep.id]: {
            status: "failed",
            src: activeStep.fallbackImage ?? "",
            error: error instanceof Error ? error.message : "Capture failed.",
          },
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [activeStep, getCapture, open]);

  if (!open) return null;

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close tutorial backdrop"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={handleClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-use-tutorial-title"
        className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#08131a] text-white shadow-[0_32px_120px_rgba(2,8,23,0.55)]"
      >
        <div className="grid lg:grid-cols-[1.06fr_0.94fr]">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  First-use guide
                </p>
                <h2 id="first-use-tutorial-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                  First-use tutorial
                </h2>
                <p className="mt-2 text-base font-medium text-white/82">
                  Welcome to Voyage
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-[15px]">
                  A short walkthrough of the homepage, workspace, and review flow. Use the screenshots to orient yourself, then jump into the real trip planning tools.
                </p>
              </div>

              <button
                type="button"
                className="rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                onClick={handleClose}
              >
                Skip tutorial
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#0f1d24] p-3 sm:p-4">
              <div className="rounded-[18px] border border-white/10 bg-[#081016] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-2">Voyage homepage preview</span>
                </div>
                <div className="aspect-[16/10] overflow-hidden">
                  {activeCapture?.status === "failed" ? (
                    <div className="flex h-full flex-col items-center justify-center bg-[#0b171e] p-6 text-center">
                      <p className="text-sm font-semibold text-white">Live preview unavailable</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
                        You can continue the guide while Voyage refreshes this preview.
                      </p>
                    </div>
                  ) : activeCapture?.status === "ready" && activeCapture.src ? (
                    <img
                      src={activeCapture.src}
                      alt={activeStep.alt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-[#0b171e] p-6 text-center">
                      <p className="text-sm font-semibold text-white">Capturing the current dashboard</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
                        Voyage is using the live page below this guide.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {homeTourSteps.map((step, index) => (
                <button
                  type="button"
                  key={step.title}
                  className={[
                    "rounded-[20px] border p-4 text-left transition-all",
                    index === activeIndex
                      ? "border-secondary/40 bg-secondary/12"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8",
                  ].join(" ")}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <TutorialStepDot active={index === activeIndex} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Step {index + 1}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{step.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.03] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
              <span>Step {activeIndex + 1} of {homeTourSteps.length}</span>
              <span>{progress}% complete</span>
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white">
              {activeStep.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/68">
              {activeStep.description}
            </p>

            <ul className="mt-6 space-y-3">
              {activeStep.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/72"
                >
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-[22px] border border-secondary/20 bg-secondary/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary/80">
                Need this later?
              </p>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Open Settings any time to replay the tutorial and review the help section with the same screenshots.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-pill border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-40"
                onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
                disabled={activeIndex === 0}
              >
                Back
              </button>
              {activeIndex < homeTourSteps.length - 1 ? (
                <button
                  type="button"
                  className="rounded-pill bg-secondary px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  onClick={() => setActiveIndex((current) => Math.min(current + 1, homeTourSteps.length - 1))}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-pill bg-secondary px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  onClick={handleClose}
                >
                  Finish tutorial
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
