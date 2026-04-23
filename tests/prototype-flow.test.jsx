import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function getHeroStartPlanningButton() {
  return screen.getByRole("button", { name: "Start planning" });
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

describe("prototype entry points", () => {
  it("routes the landing CTA to login and then completes the authenticated handoff through share", async () => {
    const landingPage = render(<Page />);

    fireEvent.click(getHeroStartPlanningButton());
    expect(mockNavigationState.routerPush).toHaveBeenCalledWith("/login");

    landingPage.unmount();
    await renderAuthenticatedPage();

    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter Workspace" }));
    fireEvent.click(screen.getByRole("tab", { name: "Share" }));
    fireEvent.click(screen.getByRole("button", { name: "Review & Export" }));

    expect(screen.getByRole("heading", { name: "The Grand Tour" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Voyage" }));

    expect(screen.getByRole("heading", { name: "Share your Voyage" })).toBeInTheDocument();
  }, 10000);

  it("moves from the authenticated handoff into the workspace tabs without using the old guest screen", async () => {
    await renderAuthenticatedPage();

    await waitFor(() => {
      expect(screen.queryByText("Continue your journey")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));

    expect(screen.getByRole("heading", { name: "Your copilot is ready." })).toBeInTheDocument();
    expect(screen.getByText(/The Voyage Agent has processed your brief/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter Workspace" }));

    expect(screen.getByRole("tab", { name: "Trip", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Workspace sections" })).toBeInTheDocument();
    expect(screen.getByText("Voyage agent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Map" }));

    expect(screen.getByText("Selected place")).toBeInTheDocument();
  }, 10000);
});
