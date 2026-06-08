/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("shows a spinner while loading", () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("forwards the disabled state", () => {
    render(<Button disabled>Locked</Button>);
    expect(screen.getByRole("button", { name: /locked/i })).toBeDisabled();
  });
});
