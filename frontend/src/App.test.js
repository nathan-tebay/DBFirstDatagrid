import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

// Prevent real API calls from page components during route rendering.
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("App", () => {
  test("renders without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
  });

  test("renders the App container element", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(container.querySelector(".App")).not.toBeNull();
  });

  test("customers route mounts without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <App />
      </MemoryRouter>
    );
  });

  test("orders route mounts without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <App />
      </MemoryRouter>
    );
  });

  test("inventory route mounts without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/inventory"]}>
        <App />
      </MemoryRouter>
    );
  });
});
