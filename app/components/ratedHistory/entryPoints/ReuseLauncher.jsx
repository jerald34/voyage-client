import { useState, useEffect } from "react";
import ReuseButton from "./ReuseButton.jsx";
import RatedHistoryPicker from "../RatedHistoryPicker.jsx";
import { useRatedHistory } from "../hooks/useRatedHistory.js";
import { useReuseDrop } from "../hooks/useReuseDrop.js";

export default function ReuseLauncher({
  agencyId,
  currentTrip = null,
  targetTripId,
  targetItineraryId,
  currentVersion,
  targetItinerary = null,
  mode = "editor",
  onInserted = () => {},
  canvasRef = null,
  panelRef = null,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch rated history with destination pre-filter
  const { trips, isLoading, error } = useRatedHistory({
    agencyId,
    filters: {
      destination: currentTrip?.destinationSummary,
    },
  });

  // Set up drop target logic
  const { registerCanvas, registerPanel } = useReuseDrop({
    targetTripId,
    targetItineraryId,
    currentVersion,
    onInserted: (updatedItinerary, advisory) => {
      setIsOpen(false);
      onInserted(updatedItinerary, advisory);
    },
  });

  // Register canvas ref on mount and when it changes
  useEffect(() => {
    if (canvasRef?.current) {
      registerCanvas(canvasRef.current);
    }
  }, [canvasRef, registerCanvas]);

  // Register panel ref on mount and when it changes
  useEffect(() => {
    if (panelRef?.current) {
      registerPanel(panelRef.current);
    }
  }, [panelRef, registerPanel]);

  // Check if all required props are present
  const canRender =
    agencyId &&
    targetTripId &&
    targetItineraryId &&
    currentVersion !== undefined &&
    currentVersion !== null;

  if (!canRender) {
    return null;
  }

  return (
    <>
      <ReuseButton
        onClick={() => setIsOpen(true)}
        count={trips.length}
        disabled={trips.length === 0}
        mode={mode}
      />
      {isOpen && (
        <RatedHistoryPicker
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          currentTrip={currentTrip}
          mode={mode}
          agencyId={agencyId}
          trips={trips}
          isLoading={isLoading}
          error={error}
          onConfirmInsertions={() => {}}
        />
      )}
    </>
  );
}
