// Animated gradient blob illustration for auth backgrounds.
export default function FloatingOrb({ delay, size, left, top }) {
  return (
    <div
      className="absolute rounded-full bg-gradient-to-br from-[rgba(216,180,160,0.18)] via-[rgba(215,122,97,0.08)] to-transparent [animation:auth-orb-drift_14s_ease-in-out_infinite_alternate] blur-[2px]"
      style={{
        width: size,
        height: size,
        left,
        top,
        animationDelay: delay,
      }}
      aria-hidden="true"
    />
  );
}
