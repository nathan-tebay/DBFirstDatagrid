import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Menu from "./Components/Menu/Menu";

const renderMenu = () => render(<MemoryRouter><Menu /></MemoryRouter>);

describe("Menu", () => {
  test("renders without crashing", () => {
    renderMenu();
  });

  test("shows a Customers navigation link", () => {
    renderMenu();
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
  });

  test("shows an Orders navigation link", () => {
    renderMenu();
    expect(screen.getByText(/orders/i)).toBeInTheDocument();
  });

  test("shows an Inventory navigation link", () => {
    renderMenu();
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
  });

  test("shows a Data navigation link", () => {
    renderMenu();
    expect(screen.getByText(/^data$/i)).toBeInTheDocument();
  });

  test("Customers link points to /customers", () => {
    renderMenu();
    const link = screen.getByText(/customers/i).closest("a");
    expect(link).toHaveAttribute("href", "/customers");
  });

  test("Orders link points to /orders", () => {
    renderMenu();
    const link = screen.getByText(/orders/i).closest("a");
    expect(link).toHaveAttribute("href", "/orders");
  });
});
