import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import KpiTile from "../app/agency/[agencyId]/components/dashboard/widgets/KpiTile.jsx";

describe("KpiTile", () => {
  it("renders the label and value", () => {
    render(<KpiTile label="Win rate" value={42.1} unit="%" deltaVsPrior={0} sparkline={[]} />);
    expect(screen.getByText("Win rate")).toBeInTheDocument();
    expect(screen.getByText("42.1")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("uses ▲ glyph and success color when delta is positive", () => {
    render(<KpiTile label="Win rate" value={42} deltaVsPrior={3.2} sparkline={[]} />);
    const triangle = screen.getByText("▲");
    expect(triangle).toBeInTheDocument();
  });

  it("uses ▼ glyph when delta is negative", () => {
    render(<KpiTile label="Win rate" value={42} deltaVsPrior={-2} sparkline={[]} />);
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("fires onClick when the tile is clicked", () => {
    const onClick = vi.fn();
    render(<KpiTile label="Win rate" value={42} deltaVsPrior={0} sparkline={[]} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders an aria-label including the value and delta direction", () => {
    render(<KpiTile label="Win rate" value={42.1} unit="%" deltaVsPrior={3.2} sparkline={[]} />);
    const button = screen.getByRole("button");
    const label = button.getAttribute("aria-label") ?? "";
    expect(label).toMatch(/Win rate/);
    expect(label).toMatch(/42\.1/);
    expect(label).toMatch(/up/i);
  });

  it("respects a custom formatValue", () => {
    render(
      <KpiTile
        label="Time"
        value={1234}
        deltaVsPrior={0}
        sparkline={[]}
        formatValue={(v) => `${v.toLocaleString()}!`}
      />
    );
    expect(screen.getByText("1,234!")).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(
      <KpiTile
        label="Avg rating"
        value={4.2}
        deltaVsPrior={0}
        sparkline={[]}
        subtitle="32 of 80 rated (40%)"
      />
    );
    expect(screen.getByText("32 of 80 rated (40%)")).toBeInTheDocument();
  });
});
