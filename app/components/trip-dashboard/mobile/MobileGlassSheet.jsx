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
  const dragState = useRef(null);
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

  const handlePointerDown = useCallback(
    (e) => {
      if (!isMobile) return;
      e.currentTarget.setPointerCapture(e.pointerId);
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
      if (!dragState.current || !isMobile) return;
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

  const handlePointerUp = useCallback(() => {
    if (!dragState.current || !isMobile) return;
    const velocity = dragState.current.velocity;
    const next = nearestSnap(sheetHeight, viewportHeight, velocity);
    setSnap(next);
    setSheetHeight(getSnapHeight(next, viewportHeight));
    dragState.current = null;
    setIsDragging(false);
  }, [isMobile, sheetHeight, viewportHeight]);

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
      className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col glass-panel border-t border-border/10 rounded-t-[24px] shadow-strong ${className}`}
      style={{
        height: sheetHeight || getSnapHeight(defaultSnap, viewportHeight || window.innerHeight),
        maxHeight,
        transition: isDragging ? "none" : "height 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: isDragging ? "height" : "auto",
      }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="w-10 h-1 rounded-full bg-border/30" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {typeof children === "function" ? children({ snap, snapTo }) : children}
      </div>

      {/* Sticky footer */}
      {footer && (
        <div className="flex-shrink-0 border-t border-border/5">
          {typeof footer === "function" ? footer({ snap, snapTo }) : footer}
        </div>
      )}
    </div>
  );
}
