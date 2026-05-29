import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

import { proxy } from "@/proxy";

function mockRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) =>
        cookies[name] ? { name, value: cookies[name] } : undefined,
      getAll: () =>
        Object.entries(cookies).map(([name, value]) => ({ name, value })),
    },
  } as unknown as NextRequest;
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("passes non-/admin paths through unchanged", async () => {
    const res = await proxy(mockRequest("/services"));
    expect(res.status).toBe(200);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("passes /admin/login through without checking the session", async () => {
    const res = await proxy(mockRequest("/admin/login"));
    expect(res.status).toBe(200);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("redirects to /admin/login when there is no signed-in user", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await proxy(mockRequest("/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/admin/login");
  });

  it("passes /admin/* through when there is a signed-in user", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });
    const res = await proxy(mockRequest("/admin/bookings"));
    expect(res.status).toBe(200);
  });
});
