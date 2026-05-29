import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted; outer variables it references must be created via vi.hoisted.
const mocks = vi.hoisted(() => {
  return {
    redirect: vi.fn((to: string) => {
      throw new Error(`__REDIRECT__:${to}`);
    }),
    supabaseMock: {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: vi.fn(async () => mocks.supabaseMock),
}));

import { requireRole } from "@/lib/auth";

function setUser(user: { id: string } | null) {
  mocks.supabaseMock.auth.getUser.mockResolvedValueOnce({
    data: { user },
    error: null,
  });
}

function setRoleLookup(role: "admin" | "editor" | null) {
  const maybeSingle = vi.fn().mockResolvedValueOnce({
    data: role ? { role } : null,
    error: null,
  });
  mocks.supabaseMock.from.mockReturnValueOnce({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
  });
}

describe("requireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /admin/login when there is no signed-in user", async () => {
    setUser(null);
    await expect(requireRole("admin")).rejects.toThrow(
      "__REDIRECT__:/admin/login",
    );
  });

  it("redirects to /admin/login when the user has no role row", async () => {
    setUser({ id: "u1" });
    setRoleLookup(null);
    await expect(requireRole("admin")).rejects.toThrow(
      "__REDIRECT__:/admin/login",
    );
  });

  it("redirects to /admin when the user has a role but not one we accept", async () => {
    setUser({ id: "u1" });
    setRoleLookup("editor");
    await expect(requireRole("admin")).rejects.toThrow(
      "__REDIRECT__:/admin",
    );
  });

  it("returns the user + role when the role matches", async () => {
    setUser({ id: "u1" });
    setRoleLookup("editor");
    const result = await requireRole("admin", "editor");
    expect(result).toEqual({ userId: "u1", role: "editor" });
  });
});
