"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import useMobileViewport from "./useMobileViewport.js";

const SNAP_POINTS = {
  peek: 120,
  half: 0.55,
  full: 0.9,
};

const VELOCITY_THRESHOLD = 0.4;

function getSnapHeight(snap, viewportHeight) {
  if (snap === "peek") return SNAP_POINTS.peek;
  if (snap === "half") return viewportHeight * SNAP_POINTS.half;
  return viewportHeight * SNAP_POINTS.full;
}

function nearestSnap(currentHeight, viewportHeight, velocity) {
  const peekH = getSnapHeight("peek", viewportHeight);
  const halfH = getSnapHeight("half", viewportHeight);
  const fullH = getSnapHeight("full", viewportHeight);

  if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
    if (velocity < 0) {
      if (currentHeight > halfH) return "full";
      if (currentHeight > peekH) return "half";
      return "peek";
    } else {
      if (currentHeight < halfH) return "peek";
      if (currentHeight < fullH) return "half";
      return "full";
    }
  }

  const distances = [
    { snap: "peek", d: Math.abs(currentHeight - peekH) },
    { snap: "half", d: Math.abs(currentHeight - halfH) },
    { snap: "full", d: Math.abs(currentHeight - fullH) },
  ];
  distances.sort((a, b) => a.d - b.d);
  return distances[0].snap;
}

export default function MobileGlassSheet({
  children,
  footer,
  defaultSnap = "half",
  onSnapChange,
  className = "",
}) {
  const isMobile = useMobileViewport();
  const sheetRef = useRef(null);
  const dragHandleRef = useRef(null);
  const dragState = useRef(null);
  const activePointerIdRef = useRef(null);
  const [snap, setSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (!isMobile) return;
    const update = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(vh);
    };
    update();
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !viewportHeight) return;
    setSheetHeight(getSnapHeight(snap, viewportHeight));
  }, [snap, viewportHeight, isMobile]);

  useEffect(() => {
    onSnapChange?.(snap);
  }, [snap, onSnapChange]);

  const endDrag = useCallback((pointerId = activePointerIdRef.current) => {
    const handle = dragHandleRef.current;
    if (handle && pointerId != null && typeof handle.hasPointerCapture === "function") {
      try {
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId);
        }
      } catch {
        // Pointer capture may already be gone if the browser released it first.
      }
    }

    dragState.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (!isMobile) return;
      const handle = e.currentTarget;
      if (typeof handle.setPointerCapture === "function") {
        try {
          handle.setPointerCapture(e.pointerId);
        } catch {
          // Ignore browsers that already consider the pointer captured.
        }
      }
      activePointerIdRef.current = e.pointerId;
      dragState.current = {
        startY: e.clientY,
        startHeight: sheetHeight,
        lastY: e.clientY,
        lastTime: Date.now(),
        velocity: 0,
      };
      setIsDragging(true);
    },
    [isMobile, sheetHeight],
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragState.current || !isMobile || activePointerIdRef.current !== e.pointerId) return;
      const ds = dragState.current;
      const delta = ds.startY - e.clientY;
      const now = Date.now();
      const dt = now - ds.lastTime;
      if (dt > 0) {
        ds.velocity = (ds.lastY - e.clientY) / dt;
      }
      ds.lastY = e.clientY;
      ds.lastTime = now;

      const maxH = viewportHeight * SNAP_POINTS.full;
      const minH = SNAP_POINTS.peek;
      const newH = Math.max(minH, Math.min(maxH, ds.startHeight + delta));
      setSheetHeight(newH);
    },
    [isMobile, viewportHeight],
  );

  const handlePointerUp = useCallback((e) => {
    if (!dragState.current || !isMobile || activePointerIdRef.current !== e.pointerId) return;
    const velocity = dragState.current.velocity;
    const next = nearestSnap(sheetHeight, viewportHeight, velocity);
    setSnap(next);
    setSheetHeight(getSnapHeight(next, viewportHeight));
    endDrag(e.pointerId);
  }, [endDrag, isMobile, sheetHeight, viewportHeight]);

  const handlePointerCancel = useCallback((e) => {
    if (!dragState.current || !isMobile || activePointerIdRef.current !== e.pointerId) return;
    const velocity = dragState.current.velocity;
    const next = nearestSnap(sheetHeight, viewportHeight, velocity);
    setSnap(next);
    setSheetHeight(getSnapHeight(next, viewportHeight));
    endDrag(e.pointerId);
  }, [endDrag, isMobile, sheetHeight, viewportHeight]);

  const handleLostPointerCapture = useCallback((e) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    endDrag(e.pointerId);
  }, [endDrag]);

  const snapTo = useCallback(
    (target) => {
      if (!isMobile || !viewportHeight) return;
      setSnap(target);
      setSheetHeight(getSnapHeight(target, viewportHeight));
    },
    [isMobile, viewportHeight],
  );

  if (!isMobile) return null;

  const headerHeight = 48;
  const maxHeight = viewportHeight ? viewportHeight - headerHeight : "90dvh";

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-[24px] bg-[rgba(255,255,255,0.16)] backdrop-blur-[24px] shadow-[0_-18px_50px_rgba(15,23,42,0.18)] ${className}`}
      style={{
        height: sheetHeight || getSnapHeight(defaultSnap, viewportHeight || window.innerHeight),
        maxHeight,
        transition: isDragging ? "none" : "height 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: isDragging ? "height" : "auto",
      }}
    >
      {/* Drag handle */}
      <div className="relative flex-shrink-0 overflow-hidden rounded-t-[24px]">
        <div
          ref={dragHandleRef}
          className="relative z-10 flex items-center justify-center gap-2 py-2.5 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
        >
          <div className="w-12 h-1.5 rounded-full bg-white/80 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div
          className="relative z-0"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0px, black 34px, black 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0px, black 34px, black 100%)",
          }}
        >
          {typeof children === "function" ? children({ snap, snapTo }) : children}
        </div>
      </div>

      {/* Sticky footer */}
      {footer && (
        <div className="flex-shrink-0 border-t border-white/10">
          {typeof footer === "function" ? footer({ snap, snapTo }) : footer}
        </div>
      )}
    </div>
  );
}
