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

describe("prototype mobile workspace", () => {
  it("keeps the workspace navigation labels visible after entering the workspace", () => {
    setMobileViewport();
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Start planning" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to Voyage agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Open workspace" }));

    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace tabs" }));

    expect(workspaceTabs.getByRole("tab", { name: "Trip" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Map" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Agent" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Share" })).toBeInTheDocument();
  });
});
