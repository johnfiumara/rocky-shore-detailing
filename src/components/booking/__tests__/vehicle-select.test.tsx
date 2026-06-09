/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VehicleSelect } from "@/components/booking/vehicle-select";
import type { VehicleSummary } from "@/components/booking/types";

const vehicles: VehicleSummary[] = [
  {
    id: "v1",
    year: 2020,
    make: "Subaru",
    model: "Outback",
    color: "Gray",
    isDefault: true,
  },
  {
    id: "v2",
    year: 2018,
    make: "Honda",
    model: "Civic",
    color: "Blue",
    isDefault: false,
  },
];

describe("VehicleSelect", () => {
  it("renders saved vehicles and the 'new' option", () => {
    render(
      <VehicleSelect vehicles={vehicles} selectedId="v1" onSelect={vi.fn()} />,
    );
    expect(screen.getByText("2020 Subaru Outback")).toBeInTheDocument();
    expect(screen.getByText("2018 Honda Civic")).toBeInTheDocument();
    expect(screen.getByText("Different vehicle")).toBeInTheDocument();
  });

  it("calls onSelect when a saved vehicle is clicked", () => {
    const onSelect = vi.fn();
    render(
      <VehicleSelect vehicles={vehicles} selectedId="v1" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("2018 Honda Civic"));
    expect(onSelect).toHaveBeenCalledWith("v2");
  });

  it("calls onSelect with 'new' when the add-new card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <VehicleSelect vehicles={vehicles} selectedId="v1" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Different vehicle"));
    expect(onSelect).toHaveBeenCalledWith("new");
  });
});
