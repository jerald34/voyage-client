import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "../app/page.jsx";

function startFromHero() {
  const heroSection = screen
    .getByRole("heading", {
      name: "Plan smarter trips with AI, itinerary logic, and map-aware routing",
    })
    .closest("section");

  fireEvent.click(within(heroSection).getByRole("button", { name: "Start planning" }));
}

describe("prototype entry points", () => {
  it("can move from workspace to review and share", () => {
    render(<HomePage />);

    startFromHero();
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));
    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter Workspace" }));
    fireEvent.click(screen.getByRole("tab", { name: "Share" }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Export" }));

    expect(screen.getByRole("heading", { name: "The Grand Tour" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Voyage" }));

    expect(screen.getByRole("heading", { name: "Share your Voyage" })).toBeInTheDocument();
  });

  it("moves from welcome to agent kickoff and into the workspace", () => {
    render(<HomePage />);

    expect(screen.queryByLabelText("Prototype flow summary")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Prototype screen rail")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Prototype stage switcher")).not.toBeInTheDocument();

    startFromHero();

    expect(screen.queryByText("Entry principle")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue as Guest" }));

    expect(
      screen.getByRole("heading", { name: "Defining the scope" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Destination")).toBeInTheDocument();
    expect(screen.getByText("Planning priorities")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));

    expect(
      screen.getByRole("heading", { name: "Your copilot is ready." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/The Voyage Agent has processed your brief/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter Workspace" }));

    expect(
      screen.getByRole("tab", { name: "Trip", selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Workspace sections" })).toBeInTheDocument();
    expect(screen.getByText("Voyage agent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Map" }));

    expect(screen.getByText("Selected place")).toBeInTheDocument();
  });
});
