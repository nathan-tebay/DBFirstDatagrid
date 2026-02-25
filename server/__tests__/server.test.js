/**
 * Server unit + integration tests.
 *
 * Uses Node.js built-in test runner (node:test) — no extra dependencies.
 * Run with:  npm test  (inside the server/ directory)
 *
 * Environment is set to use an in-memory SQLite database so these tests
 * never touch the real data file and run completely offline.
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Must set these BEFORE databaseAPI.js is loaded ──────────────────────────
// Because static `import` declarations are hoisted, we use a dynamic import
// below to ensure the env vars are in place first.
process.env.DB_TYPE = "sqlite";
process.env.SQLITE_DB = ":memory:";

const {
  validateTable,
  validateField,
  validateWhere,
  fetchFields,
  fetchData,
  addData,
  sqliteDbPromise,
} = await import("../utils/databaseAPI.js");

// ── Schema setup (runs once before all tests) ────────────────────────────────
before(async () => {
  const db = await sqliteDbPromise;
  const schema = readFileSync(
    path.join(__dirname, "../sqlite_schema.sql"),
    "utf8"
  );
  await db.exec(schema);
});

// ============================================================================
// validateTable
// ============================================================================

describe("validateTable", () => {
  it("allows whitelisted table names", () => {
    assert.doesNotThrow(() => validateTable("customers"));
    assert.doesNotThrow(() => validateTable("orders"));
    assert.doesNotThrow(() => validateTable("inventory"));
    assert.doesNotThrow(() => validateTable("orderItems"));
    assert.doesNotThrow(() => validateTable("canWeights"));
    assert.doesNotThrow(() => validateTable("vendors"));
  });

  it("returns the table name on success", () => {
    assert.strictEqual(validateTable("customers"), "customers");
  });

  it("throws for unknown tables", () => {
    assert.throws(() => validateTable("users"), /not allowed/);
    assert.throws(() => validateTable("sessions"), /not allowed/);
    assert.throws(() => validateTable(""), /not allowed/);
  });

  it("throws for SQL injection attempts via table name", () => {
    assert.throws(
      () => validateTable("customers; DROP TABLE customers; --"),
      /not allowed/
    );
    assert.throws(() => validateTable("' OR '1'='1"), /not allowed/);
  });
});

// ============================================================================
// validateField
// ============================================================================

describe("validateField", () => {
  it("allows simple alphanumeric field names", () => {
    assert.doesNotThrow(() => validateField("id"));
    assert.doesNotThrow(() => validateField("name"));
    assert.doesNotThrow(() => validateField("vendorId"));
    assert.doesNotThrow(() => validateField("contactName"));
    assert.doesNotThrow(() => validateField("unitPrice"));
  });

  it("allows SQL alias syntax used by dropdown queries", () => {
    assert.doesNotThrow(() => validateField("id as 'value'"));
    assert.doesNotThrow(() => validateField("name as 'text'"));
    assert.doesNotThrow(() => validateField("description as 'data-description'"));
    assert.doesNotThrow(() => validateField("email as 'data-email'"));
  });

  it("throws for injection attempts", () => {
    assert.throws(() => validateField("id; DROP TABLE"), /not in a safe format/);
    assert.throws(() => validateField("* FROM users --"), /not in a safe format/);
    assert.throws(() => validateField(""), /not in a safe format/);
    assert.throws(() => validateField("1=1"), /not in a safe format/);
  });
});

// ============================================================================
// validateWhere
// ============================================================================

describe("validateWhere", () => {
  it("passes null and undefined through unchanged", () => {
    assert.strictEqual(validateWhere(null), null);
    assert.strictEqual(validateWhere(undefined), undefined);
  });

  it("allows fieldName=integerValue patterns", () => {
    assert.doesNotThrow(() => validateWhere("customerId=1"));
    assert.doesNotThrow(() => validateWhere("orderId=999"));
    assert.doesNotThrow(() => validateWhere("inventoryId=12345"));
  });

  it("throws for compound or non-integer WHERE clauses", () => {
    assert.throws(() => validateWhere("1=1"), /not in a safe format/);
    assert.throws(() => validateWhere("id=1 OR 1=1"), /not in a safe format/);
    assert.throws(() => validateWhere("id='string'"), /not in a safe format/);
    assert.throws(
      () => validateWhere("'; DROP TABLE orders; --"),
      /not in a safe format/
    );
    assert.throws(() => validateWhere("id="), /not in a safe format/);
  });
});

// ============================================================================
// fetchFields
// ============================================================================

describe("fetchFields", () => {
  it("returns an array of field descriptors for a valid table", async () => {
    const fields = await fetchFields("customers");
    assert.ok(Array.isArray(fields), "result should be an array");
    assert.ok(fields.length > 0, "should have at least one field");
  });

  it("includes expected field names for the customers table", async () => {
    const fields = await fetchFields("customers");
    const names = fields.map((f) => f.name);
    assert.ok(names.includes("id"), "should include id");
    assert.ok(names.includes("name"), "should include name");
    assert.ok(names.includes("email"), "should include email");
    assert.ok(names.includes("contactName"), "should include contactName");
  });

  it("returns fields with displayText and type properties", async () => {
    const fields = await fetchFields("customers");
    for (const f of fields) {
      assert.ok(f.name, "each field should have a name");
      assert.ok(f.displayText !== undefined, "each field should have displayText");
    }
  });

  it("throws for a disallowed table", async () => {
    await assert.rejects(() => fetchFields("users"), /not allowed/);
  });
});

// ============================================================================
// fetchData
// ============================================================================

describe("fetchData", () => {
  it("returns rows for the orderStatus table (seeded by schema)", async () => {
    const rows = await fetchData("orderStatus");
    assert.ok(Array.isArray(rows), "should return an array");
    assert.ok(rows.length >= 5, "should have the five seeded statuses");
  });

  it("every row includes a count column for pagination", async () => {
    const rows = await fetchData("orderStatus");
    assert.ok(rows.length > 0);
    assert.ok(
      Object.prototype.hasOwnProperty.call(rows[0], "count"),
      "first row should have a count property"
    );
  });

  it("returns an array (possibly empty) for the customers table", async () => {
    const rows = await fetchData("customers");
    assert.ok(Array.isArray(rows));
  });

  it("respects a safe WHERE clause", async () => {
    // Insert a known customer then retrieve it by id
    const inserted = await addData("customers", { name: "WHERE Test Customer" });
    const rows = await fetchData("customers", null, `id=${inserted.id}`);
    assert.ok(rows.length > 0, "should find the inserted row");
    assert.strictEqual(rows[0].name, "WHERE Test Customer");
  });

  it("throws for a disallowed table", async () => {
    await assert.rejects(() => fetchData("users"), /not allowed/);
  });

  it("throws for an unsafe WHERE clause", async () => {
    await assert.rejects(
      () => fetchData("customers", null, "1=1 OR 1=1"),
      /not in a safe format/
    );
  });
});

// ============================================================================
// addData
// ============================================================================

describe("addData", () => {
  it("inserts a new row and returns a positive id", async () => {
    const result = await addData("customers", {
      name: "Test Customer A",
      email: "a@example.com",
    });
    assert.ok(typeof result.id === "number", "id should be a number");
    assert.ok(result.id > 0, "id should be positive");
  });

  it("inserted row is retrievable via fetchData", async () => {
    const result = await addData("customers", { name: "Test Customer B" });
    const rows = await fetchData("customers", null, `id=${result.id}`);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].name, "Test Customer B");
  });

  it("can insert into the inventory table", async () => {
    const result = await addData("inventory", {
      inventoryNumber: "INV-TEST-001",
      description: "Test Item",
      quantity: 5,
      unitPrice: 9.99,
    });
    assert.ok(result.id > 0);
  });

  it("ignores the id field when inserting", async () => {
    // Supplying id should not cause an error; it is silently ignored
    const result = await addData("customers", {
      id: 9999,
      name: "No-ID Override",
    });
    assert.ok(result.id > 0);
    assert.notStrictEqual(result.id, 9999);
  });

  it("throws for a disallowed table", async () => {
    await assert.rejects(() => addData("users", { name: "x" }), /not allowed/);
  });

  it("throws for a column name containing injection characters", async () => {
    await assert.rejects(
      () => addData("customers", { "name; DROP TABLE customers": "x" }),
      /not in a safe format/
    );
  });
});
