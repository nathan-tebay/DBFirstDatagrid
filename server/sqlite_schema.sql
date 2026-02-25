-- SQLite schema for MAPDashboard (compatible with sqlite3)
-- Run with: sqlite3 mapequipment.db < sqlite_schema.sql

PRAGMA foreign_keys = ON;

-- Lookup / reference tables
CREATE TABLE IF NOT EXISTS vendor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS orderStatus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shippingCarrier (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  estimatedCost REAL
);

-- Main business entities
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  contactName TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postalCode TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendorId INTEGER REFERENCES vendor(id),
  inventoryNumber TEXT UNIQUE,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unitPrice REAL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerId INTEGER NOT NULL REFERENCES customers(id),
  orderStatusId INTEGER REFERENCES orderStatus(id),
  shippingCarrierId INTEGER REFERENCES shippingCarrier(id),
  orderDate TEXT,
  shippedDate TEXT,
  total REAL DEFAULT 0.0
);

-- Example table referenced in code
CREATE TABLE IF NOT EXISTS canWeights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canType TEXT,
  weight REAL
);

-- Example many-to-many / line items for orders
CREATE TABLE IF NOT EXISTS orderItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventoryId INTEGER NOT NULL REFERENCES inventory(id),
  quantity INTEGER DEFAULT 1,
  unitPrice REAL DEFAULT 0.0
);

-- Useful indices
CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId);
CREATE INDEX IF NOT EXISTS idx_inventory_vendorId ON inventory(vendorId);

-- ---------------------------------------------------------------------------
-- Lookup / reference seed data
-- ---------------------------------------------------------------------------

INSERT INTO orderStatus (status) SELECT 'Pending'    WHERE NOT EXISTS (SELECT 1 FROM orderStatus WHERE status='Pending');
INSERT INTO orderStatus (status) SELECT 'Processing' WHERE NOT EXISTS (SELECT 1 FROM orderStatus WHERE status='Processing');
INSERT INTO orderStatus (status) SELECT 'Shipped'    WHERE NOT EXISTS (SELECT 1 FROM orderStatus WHERE status='Shipped');
INSERT INTO orderStatus (status) SELECT 'Delivered'  WHERE NOT EXISTS (SELECT 1 FROM orderStatus WHERE status='Delivered');
INSERT INTO orderStatus (status) SELECT 'Cancelled'  WHERE NOT EXISTS (SELECT 1 FROM orderStatus WHERE status='Cancelled');

INSERT INTO shippingCarrier (name, estimatedCost) SELECT 'UPS',    10.00 WHERE NOT EXISTS (SELECT 1 FROM shippingCarrier WHERE name='UPS');
INSERT INTO shippingCarrier (name, estimatedCost) SELECT 'FedEx',  12.00 WHERE NOT EXISTS (SELECT 1 FROM shippingCarrier WHERE name='FedEx');
INSERT INTO shippingCarrier (name, estimatedCost) SELECT 'USPS',    8.50 WHERE NOT EXISTS (SELECT 1 FROM shippingCarrier WHERE name='USPS');
INSERT INTO shippingCarrier (name, estimatedCost) SELECT 'DHL',    15.00 WHERE NOT EXISTS (SELECT 1 FROM shippingCarrier WHERE name='DHL');

INSERT INTO vendor (name, description) SELECT 'Default Vendor', 'Placeholder vendor'        WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='Default Vendor');
INSERT INTO vendor (name, description) SELECT 'Acme Corp',      'Industrial supplies'       WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='Acme Corp');
INSERT INTO vendor (name, description) SELECT 'Beta Supply',    'Bulk materials & fittings' WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='Beta Supply');
INSERT INTO vendor (name, description) SELECT 'Delta Parts',    'Precision components'      WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='Delta Parts');

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Acme Industries',      'orders@acme.com',           'Jane Smith',   '555-1001', '100 Main St',      'Springfield',     'IL', '62701'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Acme Industries');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Metro Hardware',       'buying@metrohw.com',        'Bob Johnson',  '555-2002', '200 Oak Ave',      'Shelbyville',     'IL', '62565'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Metro Hardware');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'City Maintenance LLC', 'procurement@citymaint.com', 'Alice Brown',  '555-3003', '300 Elm Blvd',     'Capital City',    'IL', '62702'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='City Maintenance LLC');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Lakeside Utilities',   'ops@lakesideutility.com',   'Carlos Reyes', '555-4004', '400 Lakeshore Dr', 'Ogdenville',      'IL', '62024'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Lakeside Utilities');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Summit Engineering',   'parts@summitengineer.net',  'Dana Park',    '555-5005', '500 Summit Way',   'North Haverbrook','IL', '61073'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Summit Engineering');

-- ---------------------------------------------------------------------------
-- Inventory  (vendorId: 2=Acme Corp, 3=Beta Supply, 4=Delta Parts)
-- ---------------------------------------------------------------------------

INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 2, 'INV-001', '6" Gate Valve',              25,  142.50 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-001');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 2, 'INV-002', '4" Ball Valve',              40,   89.99 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-002');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 3, 'INV-003', 'Pressure Gauge 0-200 psi',  60,   34.75 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-003');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 3, 'INV-004', '1/2" Copper Tubing (10 ft)',100,   22.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-004');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 4, 'INV-005', 'Flow Meter DN50',            15,  310.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-005');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 4, 'INV-006', 'Check Valve 2"',             30,   55.25 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-006');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 2, 'INV-007', 'Pipe Flange 6" Class 150',  20,   78.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='INV-007');

-- ---------------------------------------------------------------------------
-- Orders  (orderStatusId: 1=Pending 2=Processing 3=Shipped 4=Delivered 5=Cancelled)
--         (shippingCarrierId: 1=UPS 2=FedEx 3=USPS 4=DHL)
-- ---------------------------------------------------------------------------

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 1, 4, 1, '2024-01-15', '2024-01-18',  427.50
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=1 AND orderDate='2024-01-15');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 2, 1, 2, '2024-02-01', NULL,           269.97
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=2 AND orderDate='2024-02-01');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 3, 2, 1, '2024-02-10', NULL,           697.50
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=3 AND orderDate='2024-02-10');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 4, 3, 3, '2024-03-05', '2024-03-08',  166.00
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=4 AND orderDate='2024-03-05');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 5, 4, 2, '2024-03-22', '2024-03-25',  534.25
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=5 AND orderDate='2024-03-22');

-- ---------------------------------------------------------------------------
-- Order items
-- ---------------------------------------------------------------------------

-- Order 1: 2x Gate Valve + 4x Pressure Gauge
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 1, 1, 2, 142.50 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=1 AND inventoryId=1);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 1, 3, 4,  34.75 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=1 AND inventoryId=3);

-- Order 2: 3x Ball Valve
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 2, 2, 3, 89.99 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=2 AND inventoryId=2);

-- Order 3: 3x Gate Valve + 10x Copper Tubing + 2x Check Valve
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 3, 1, 3, 142.50 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=3 AND inventoryId=1);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 3, 4, 10,  22.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=3 AND inventoryId=4);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 3, 6,  2,  55.25 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=3 AND inventoryId=6);

-- Order 4: 2x Check Valve + 1x Pressure Gauge + 1x Copper Tubing
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 4, 6, 2, 55.25 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=4 AND inventoryId=6);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 4, 3, 1, 34.75 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=4 AND inventoryId=3);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 4, 4, 1, 22.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=4 AND inventoryId=4);

-- Order 5: 1x Flow Meter + 2x Pipe Flange + 2x Pressure Gauge
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 5, 5, 1, 310.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=5 AND inventoryId=5);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 5, 7, 2,  78.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=5 AND inventoryId=7);
INSERT INTO orderItems (orderId, inventoryId, quantity, unitPrice)
  SELECT 5, 3, 2,  34.75 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=5 AND inventoryId=3);

-- ---------------------------------------------------------------------------
-- Can weights (reference data)
-- ---------------------------------------------------------------------------

INSERT INTO canWeights (canType, weight) SELECT '8oz Tin',          0.24 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='8oz Tin');
INSERT INTO canWeights (canType, weight) SELECT '10oz Tin',         0.32 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='10oz Tin');
INSERT INTO canWeights (canType, weight) SELECT '16oz Steel',       0.55 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='16oz Steel');
INSERT INTO canWeights (canType, weight) SELECT '32oz Aluminum',    0.41 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='32oz Aluminum');
INSERT INTO canWeights (canType, weight) SELECT '64oz Tin',         0.78 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='64oz Tin');
INSERT INTO canWeights (canType, weight) SELECT '128oz Steel',      1.20 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='128oz Steel');
INSERT INTO canWeights (canType, weight) SELECT '1 Gallon Plastic', 0.65 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='1 Gallon Plastic');

-- End of schema
