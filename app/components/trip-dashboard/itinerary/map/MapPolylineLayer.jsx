"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

// Custom Polyline component for react-google-maps
export default function Polyline({ points, color = "#3b82f6", weight = 3, opacity = 0.5, dashArray, zIndex }) {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !maps || !points.length) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const polyline = new maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: weight,
      zIndex,
      icons: dashArray ? [{
        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
        offset: "0",
        repeat: "10px"
      }] : []
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, maps, points, color, weight, opacity, dashArray, zIndex]);

  return null;
}
