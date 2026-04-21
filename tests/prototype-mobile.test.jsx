import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "../app/page.jsx";

function setMobileViewport() {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
    writable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 844,
    writable: true,
  });
  window.dispatchEvent(new Event("resize"));
}

function startFromHero() {
  const heroSection = screen
    .getByRole("heading", {
      name: "Plan smarter trips with AI, itinerary logic, and map-aware routing",
    })
    .closest("section");

  fireEvent.click(within(heroSection).getByRole("button", { name: "Start planning" }));
}

describe("prototype mobile workspace", () => {
  it("keeps the workspace navigation labels visible after entering the workspace", () => {
    setMobileViewport();
    render(<HomePage />);

    startFromHero();
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter Workspace" }));

    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace sections" }));

    expect(workspaceTabs.getByRole("tab", { name: "Trip" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Map" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Agent" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Share" })).toBeInTheDocument();
  });
});
