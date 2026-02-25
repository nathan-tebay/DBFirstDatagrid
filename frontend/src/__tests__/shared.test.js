import { camelCaseToLabel } from "../shared";

describe("camelCaseToLabel", () => {
  test("returns empty string for empty input", () => {
    expect(camelCaseToLabel("")).toBe("");
  });

  test("capitalizes a single-word field", () => {
    expect(camelCaseToLabel("name")).toBe("Name");
    expect(camelCaseToLabel("email")).toBe("Email");
    expect(camelCaseToLabel("phone")).toBe("Phone");
  });

  test("inserts a space before each capital letter", () => {
    expect(camelCaseToLabel("contactName")).toBe("Contact Name");
    expect(camelCaseToLabel("orderDate")).toBe("Order Date");
    expect(camelCaseToLabel("unitPrice")).toBe("Unit Price");
    expect(camelCaseToLabel("postalCode")).toBe("Postal Code");
  });

  test("strips a trailing 's' to de-pluralize table names", () => {
    // DataGrid calls camelCaseToLabel(table) for the Add button label.
    expect(camelCaseToLabel("orders")).toBe("Order");
    expect(camelCaseToLabel("customers")).toBe("Customer");
  });

  test("converts 'ies' ending to 'y' before stripping 's'", () => {
    // e.g. "companies" → "Companies" → "Company"
    expect(camelCaseToLabel("companies")).toBe("Company");
  });

  test("leaves non-plural words unchanged", () => {
    expect(camelCaseToLabel("inventory")).toBe("Inventory");
  });

  test("handles foreign-key Id fields (split at the capital 'I')", () => {
    // The regex splits on the LAST capital letter, so "vendorId" →
    // "vendor Id" → "Vendor Id"  (Id suffix is stripped by databaseAPI, not here)
    expect(camelCaseToLabel("vendorId")).toBe("Vendor Id");
    expect(camelCaseToLabel("inventoryNumber")).toBe("Inventory Number");
  });
});
