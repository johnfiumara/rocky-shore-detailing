/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BookingStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it.each([
    [BookingStatus.PENDING, "Pending"],
    [BookingStatus.CONFIRMED, "Confirmed"],
    [BookingStatus.IN_PROGRESS, "In Progress"],
    [BookingStatus.COMPLETED, "Completed"],
    [BookingStatus.CANCELLED, "Cancelled"],
  ] as const)("renders %s as %s", (status, label) => {
    render(<Badge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
