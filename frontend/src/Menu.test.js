import { render, screen } from "@testing-library/react";
import Menu from "./Components/Menu/Menu";

describe("Menu", () => {
  test("renders without crashing", () => {
    render(<Menu />);
  });

  test("shows a Customers navigation link", () => {
    render(<Menu />);
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
  });

  test("shows an Orders navigation link", () => {
    render(<Menu />);
    expect(screen.getByText(/orders/i)).toBeInTheDocument();
  });

  test("shows an Inventory navigation link", () => {
    render(<Menu />);
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
  });

  test("shows a Data navigation link", () => {
    render(<Menu />);
    expect(screen.getByText(/^data$/i)).toBeInTheDocument();
  });

  test("Customers link points to /customers", () => {
    render(<Menu />);
    const link = screen.getByText(/customers/i).closest("a");
    expect(link).toHaveAttribute("href", "/customers");
  });

  test("Orders link points to /orders", () => {
    render(<Menu />);
    const link = screen.getByText(/orders/i).closest("a");
    expect(link).toHaveAttribute("href", "/orders");
  });
});
