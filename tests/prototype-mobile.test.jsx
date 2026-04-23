import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "../app/page.jsx";

const mockNavigationState = {
  authenticated: null,
  routerPush: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockNavigationState.routerPush,
  }),
  useSearchParams: () => ({
    get: (key) => (key === "authenticated" ? mockNavigationState.authenticated : null),
  }),
}));

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

async function renderAuthenticatedPage() {
  mockNavigationState.authenticated = "1";
  window.localStorage.setItem("voyage-user", JSON.stringify({ id: "user-1" }));
  render(<Page />);
  await screen.findByRole("heading", { name: "Your itinerary at a glance" });
}

beforeEach(() => {
  mockNavigationState.authenticated = null;
  mockNavigationState.routerPush.mockReset();
  window.localStorage.clear();
});

describe("prototype mobile workspace", () => {
  it("keeps the workspace navigation labels visible after the authenticated handoff enters the workspace", async () => {
    setMobileViewport();
    await renderAuthenticatedPage();

    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter Workspace" }));

    const workspaceTabs = within(screen.getByRole("tablist", { name: "Workspace sections" }));

    expect(workspaceTabs.getByRole("tab", { name: "Trip" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Map" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Agent" })).toBeInTheDocument();
    expect(workspaceTabs.getByRole("tab", { name: "Share" })).toBeInTheDocument();
  }, 10000);
});
