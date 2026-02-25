import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useFetch } from "../hooks/useFetch";

// ── Wrapper component ─────────────────────────────────────────────────────────
// useFetch is a hook; we test it through a thin wrapper component so we can
// assert on the rendered output without needing a separate renderHook utility.

function FetchWrapper({ path, params }) {
  const { data, loading, error } = useFetch(path, params);
  return (
    <div>
      {loading && <span data-testid="loading">loading</span>}
      {error && <span data-testid="error">{error.message}</span>}
      {data && <span data-testid="data">{JSON.stringify(data)}</span>}
    </div>
  );
}

// ── fetch mock helpers ────────────────────────────────────────────────────────

function mockFetchOk(body) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    })
  );
}

function mockFetchError(status, text) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      text: () => Promise.resolve(text),
    })
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useFetch", () => {
  test("shows loading indicator immediately", () => {
    // Fetch never resolves → stays in loading state
    global.fetch = jest.fn(() => new Promise(() => {}));
    render(<FetchWrapper path="test" params={{}} />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  test("shows data after a successful fetch", async () => {
    const payload = [{ id: 1, name: "Test Row" }];
    mockFetchOk(payload);
    render(<FetchWrapper path="fetchFields" params={{ table: "customers" }} />);
    await waitFor(() =>
      expect(screen.getByTestId("data")).toBeInTheDocument()
    );
    expect(screen.getByTestId("data").textContent).toBe(
      JSON.stringify(payload)
    );
  });

  test("loading indicator disappears after data arrives", async () => {
    mockFetchOk([]);
    render(<FetchWrapper path="test" params={{}} />);
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument()
    );
  });

  test("shows an error message when the server returns a non-OK response", async () => {
    mockFetchError(500, "Internal Server Error");
    render(<FetchWrapper path="fetch" params={{ table: "customers" }} />);
    await waitFor(() =>
      expect(screen.getByTestId("error")).toBeInTheDocument()
    );
    expect(screen.getByTestId("error").textContent).toMatch(/500/);
  });

  test("does not call fetch when path is unchanged between renders", async () => {
    mockFetchOk([]);
    const { rerender } = render(
      <FetchWrapper path="test" params={{ table: "customers" }} />
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument()
    );
    const callCount = global.fetch.mock.calls.length;

    // Re-render with same params (new object reference but same values)
    rerender(<FetchWrapper path="test" params={{ table: "customers" }} />);
    // Allow any potential extra effects to run
    await waitFor(() => {});
    expect(global.fetch.mock.calls.length).toBe(callCount);
  });

  test("refetches when path changes", async () => {
    mockFetchOk([]);
    const { rerender } = render(
      <FetchWrapper path="fetchFields" params={{ table: "customers" }} />
    );
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument()
    );

    rerender(<FetchWrapper path="fetchFields" params={{ table: "orders" }} />);
    await waitFor(() =>
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument()
    );
    // fetch should have been called at least twice
    expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
