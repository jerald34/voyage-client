import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "../app/page.jsx";

describe("prototype entry points", () => {
  it("can move from workspace to review and share", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Start planning" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to Voyage agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Open workspace" }));
    fireEvent.click(screen.getByRole("button", { name: "Review trip" }));

    expect(screen.getByRole("heading", { name: "Trip review" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Share trip" }));

    expect(screen.getByRole("heading", { name: "Share and export" })).toBeInTheDocument();
  });

  it("moves from welcome to agent kickoff and into the workspace", () => {
    render(<HomePage />);

    expect(screen.queryByLabelText("Prototype flow summary")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Prototype screen rail")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Prototype stage switcher")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start planning" }));

    expect(screen.queryByText("Entry principle")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));

    expect(
      screen.getByRole("heading", { name: "Build your trip brief" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Destination")).toBeInTheDocument();
    expect(screen.queryByText("What happens next")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue to Voyage agent" }));

    expect(
      screen.getByRole("heading", { name: "Bring in Voyage agent as your planning copilot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Voyage agent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open workspace" }));

    expect(
      screen.getByRole("tab", { name: "Trip", selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByText("Voyage agent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Map" }));

    expect(screen.getByText("Selected place")).toBeInTheDocument();
  });
});
