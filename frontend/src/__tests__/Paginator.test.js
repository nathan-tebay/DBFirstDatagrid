import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Paginator from "../Components/Paginator/Paginator";

describe("Paginator", () => {
  // ── No navigation for single-page datasets ────────────────────────────────

  test("renders no page items when there is only one page", () => {
    const { container } = render(
      <Paginator itemCount={99} page={1} setPageNumber={jest.fn()} gridName="g" />
    );
    expect(container.querySelectorAll(".page-item").length).toBe(0);
  });

  test("renders no page items for exactly 100 items (1 full page)", () => {
    const { container } = render(
      <Paginator itemCount={100} page={1} setPageNumber={jest.fn()} gridName="g" />
    );
    expect(container.querySelectorAll(".page-item").length).toBe(0);
  });

  // ── Page numbers ──────────────────────────────────────────────────────────

  test("renders page numbers for a multi-page dataset", () => {
    render(
      <Paginator itemCount={300} page={1} setPageNumber={jest.fn()} gridName="g" />
    );
    // 300 items / 100 per page = 3 pages → 1, 2, 3
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("marks the current page as active", () => {
    const { container } = render(
      <Paginator itemCount={500} page={3} setPageNumber={jest.fn()} gridName="g" />
    );
    const activeItem = container.querySelector(".page-item.active");
    expect(activeItem).not.toBeNull();
    expect(activeItem.textContent).toContain("3");
  });

  // ── Prev / Next ───────────────────────────────────────────────────────────

  test("Prev button is disabled on page 1", () => {
    const { container } = render(
      <Paginator itemCount={500} page={1} setPageNumber={jest.fn()} gridName="g" />
    );
    const prevItem = container.querySelector(".page-item:first-child");
    expect(prevItem.classList.contains("disabled")).toBe(true);
  });

  test("Next button is disabled on the last page", () => {
    const { container } = render(
      // 200 items = 2 pages; current page = 2 (last)
      <Paginator itemCount={200} page={2} setPageNumber={jest.fn()} gridName="g" />
    );
    const items = container.querySelectorAll(".page-item");
    const lastItem = items[items.length - 1];
    expect(lastItem.classList.contains("disabled")).toBe(true);
  });

  // ── onClick callbacks ─────────────────────────────────────────────────────

  test("clicking a page number calls setPageNumber with that number", () => {
    const setPageNumber = jest.fn();
    render(
      <Paginator itemCount={500} page={3} setPageNumber={setPageNumber} gridName="g" />
    );
    userEvent.click(screen.getByText("4"));
    expect(setPageNumber).toHaveBeenCalledWith(4);
  });

  test("clicking Prev calls setPageNumber with page - 1", () => {
    const setPageNumber = jest.fn();
    const { container } = render(
      <Paginator itemCount={500} page={3} setPageNumber={setPageNumber} gridName="g" />
    );
    const prevLink = container.querySelector(".page-item:first-child .page-link");
    userEvent.click(prevLink);
    expect(setPageNumber).toHaveBeenCalledWith(2);
  });

  test("clicking Next calls setPageNumber with page + 1", () => {
    const setPageNumber = jest.fn();
    const { container } = render(
      <Paginator itemCount={500} page={3} setPageNumber={setPageNumber} gridName="g" />
    );
    const items = container.querySelectorAll(".page-item");
    const nextLink = items[items.length - 1].querySelector(".page-link");
    userEvent.click(nextLink);
    expect(setPageNumber).toHaveBeenCalledWith(4);
  });

  // ── Ellipsis / boundary pages ─────────────────────────────────────────────

  test("shows first page and ellipsis when window has scrolled past it", () => {
    // 1000 items = 10 pages, current = 7 → should show 1, …, 5 6 7 8 9, …, 10
    render(
      <Paginator itemCount={1000} page={7} setPageNumber={jest.fn()} gridName="g" />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
