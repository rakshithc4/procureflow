import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DemoBanner } from "@/components/demo-banner";
import { markDemoMode } from "@/lib/demo-mode";

function renderBanner() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <DemoBanner />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  act(() => markDemoMode(false));
  document.cookie = "pf_demo=; Max-Age=0; Path=/";
});

describe("DemoBanner", () => {
  it("renders nothing while the live backend is in use", () => {
    renderBanner();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the sleeping-backend message once a response is flagged as demo", () => {
    renderBanner();
    act(() => markDemoMode(true));
    expect(screen.getByRole("status")).toHaveTextContent(
      "SAP backend asleep (trial system) — showing demo data.",
    );
  });

  it("shows on first paint when the session cookie is already set", () => {
    document.cookie = "pf_demo=1; Path=/";
    renderBanner();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("'Retry live backend' clears the flag and the cookie", async () => {
    document.cookie = "pf_demo=1; Path=/";
    renderBanner();
    await userEvent.click(screen.getByRole("button", { name: /retry live/i }));
    expect(document.cookie).not.toContain("pf_demo=1");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
