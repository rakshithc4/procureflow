import { describe, expect, it } from "vitest";
import { redirectTarget } from "@/middleware-logic";

describe("redirectTarget", () => {
  it("sends anonymous visitors on a protected route to /login", () => {
    expect(redirectTarget("/requisitions", false)).toBe("/login");
  });

  it("lets anonymous visitors stay on /login", () => {
    expect(redirectTarget("/login", false)).toBeNull();
  });

  it("sends logged-in visitors away from /login to the dashboard", () => {
    expect(redirectTarget("/login", true)).toBe("/");
  });

  it("lets logged-in visitors stay on a protected route", () => {
    expect(redirectTarget("/requisitions", true)).toBeNull();
  });

  it("treats nested /login paths as the login page", () => {
    expect(redirectTarget("/login/", false)).toBeNull();
  });
});
