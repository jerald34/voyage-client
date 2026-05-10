export default function GlassPanel({ children }) {
  return (
    <div className="absolute top-8 left-8 bottom-8 w-96 glass-panel overflow-y-auto z-10 flex flex-col p-6">
      {children}
    </div>
  );
}
