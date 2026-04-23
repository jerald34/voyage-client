import { fireEvent, render, screen } from "@testing-library/react";
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

beforeEach(() => {
  mockNavigationState.authenticated = null;
  mockNavigationState.routerPush.mockReset();
  window.localStorage.clear();
});

describe("landing page", () => {
  it("renders the marketing navigation and explainer sections", () => {
    render(<Page />);

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "How It Works" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "For Agencies" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "For Travelers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voyage Agent" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Plan smarter trips with AI, itinerary logic, and map-aware routing",
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "What is Voyage?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How Voyage works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Built for every kind of planner" })).toBeInTheDocument();
  }, 10000);

  it("routes the start planning CTA to /login instead of opening the old guest screen", () => {
    render(<Page />);

    fireEvent.click(getHeroStartPlanningButton());

    expect(mockNavigationState.routerPush).toHaveBeenCalledWith("/login");
    expect(screen.queryByRole("button", { name: "Continue as Guest" })).not.toBeInTheDocument();
  }, 10000);
});
