import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../app/lib/api/admin.js", () => ({
  fetchReports: vi.fn().mockResolvedValue({ reports: [{ id: "r1", subject: "Crash", category: "BUG", status: "NEW", reporterUser: { email: "a@b.com" }, createdAt: "2026-06-01" }] }),
  fetchReportDetail: vi.fn().mockResolvedValue({ report: { id: "r1", subject: "Crash", category: "BUG", status: "NEW", message: "It broke", reporterUser: { email: "a@b.com" }, createdAt: "2026-06-01" } }),
  updateReport: vi.fn().mockResolvedValue({ report: {} }),
}));

import ReportsSection from "../app/components/admin/reports/ReportsSection.jsx";

describe("ReportsSection", () => {
  it("lists reports and opens detail on click", async () => {
    render(<ReportsSection />);
    await waitFor(() => expect(screen.getByText("Crash")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Crash"));
    await waitFor(() => expect(screen.getByText("It broke")).toBeInTheDocument());
  });
});
