import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "../app/page.jsx";

describe("landing page", () => {
  it("renders the marketing navigation and explainer sections", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How It Works" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "For Agencies" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "For Travelers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voyage Agent" })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Plan smarter trips with AI, itinerary logic, and map-aware routing",
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "What is Voyage?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How Voyage works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Built for every kind of planner" })).toBeInTheDocument();
  });

  it("keeps the start planning CTA connected to the entry flow", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Start planning" }));

    expect(screen.getByRole("heading", { name: "Continue your journey" })).toBeInTheDocument();
  });
});
