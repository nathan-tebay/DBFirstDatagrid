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
  inventoryId INTEGER REFERENCES inventory(id),
  orderQuantity INTEGER DEFAULT 1,
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

INSERT INTO vendor (name, description) SELECT 'MAP Equipment',        'Configured auto-rejection systems and service kits' WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='MAP Equipment');
INSERT INTO vendor (name, description) SELECT 'PneumaTech Controls',  'Pneumatic valves, manifolds, and sensor hardware'    WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='PneumaTech Controls');
INSERT INTO vendor (name, description) SELECT 'Inline Vision Systems','Cameras, lighting, and inspection controllers'       WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='Inline Vision Systems');
INSERT INTO vendor (name, description) SELECT 'CanLine Components',   'Conveyor, guide rail, and checkweigher parts'        WHERE NOT EXISTS (SELECT 1 FROM vendor WHERE name='CanLine Components');

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'High Plains Cannery',  'maintenance@highplainscannery.com', 'Erin Cole',    '307-555-0142', '1840 Packing House Rd', 'Cheyenne',       'WY', '82001'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='High Plains Cannery');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Front Range Beverages','lineops@frontrangebev.com',         'Marcus Reed',  '303-555-0198', '6200 Bottling Ave',     'Longmont',       'CO', '80501'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Front Range Beverages');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Summit Pet Foods',     'procurement@summitpetfoods.com',    'Leah Morgan',  '970-555-0164', '4550 Kibble Plant Way', 'Greeley',        'CO', '80631'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Summit Pet Foods');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Riverbend Craft Brewing','packaging@riverbendbrew.com',     'Nora Patel',   '720-555-0117', '910 Fermentation Ln',   'Fort Collins',   'CO', '80524'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Riverbend Craft Brewing');

INSERT INTO customers (name, email, contactName, phone, address, city, state, postalCode)
  SELECT 'Wasatch Co-Pack',      'parts@wasatchcopack.com',           'Owen Kim',     '801-555-0186', '3773 Fulfillment Pkwy', 'Ogden',          'UT', '84401'
  WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name='Wasatch Co-Pack');

-- ---------------------------------------------------------------------------
-- Inventory  (vendorId: 1=MAP Equipment, 2=PneumaTech Controls,
--             3=Inline Vision Systems, 4=CanLine Components)
-- ---------------------------------------------------------------------------

INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 1, 'MAP-AR-100', 'Reject arm assembly',        8, 1240.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-AR-100');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 3, 'MAP-VC-220', 'Vision camera kit',          6, 2850.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-VC-220');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 2, 'MAP-PS-030', 'Photoeye sensor',           24,  185.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-PS-030');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 4, 'MAP-CV-060', 'Conveyor belt, 6 inch',     12,  315.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-CV-060');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 2, 'MAP-AJ-010', 'Air jet manifold',          10,  475.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-AJ-010');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 1, 'MAP-CP-400', 'Control panel I/O module', 14,  620.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-CP-400');
INSERT INTO inventory (vendorId, inventoryNumber, description, quantity, unitPrice)
  SELECT 4, 'MAP-CW-012', 'Checkweigher load cell',   18,  395.00 WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventoryNumber='MAP-CW-012');

-- ---------------------------------------------------------------------------
-- Orders  (orderStatusId: 1=Pending 2=Processing 3=Shipped 4=Delivered 5=Cancelled)
--         (shippingCarrierId: 1=UPS 2=FedEx 3=USPS 4=DHL)
-- ---------------------------------------------------------------------------

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 1, 4, 1, '2024-01-15', '2024-01-18', 1980.00
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=1 AND orderDate='2024-01-15');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 2, 1, 2, '2024-02-01', NULL,           950.00
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=2 AND orderDate='2024-02-01');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 3, 2, 1, '2024-02-10', NULL,          4880.00
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=3 AND orderDate='2024-02-10');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 4, 3, 3, '2024-03-05', '2024-03-08', 1160.00
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=4 AND orderDate='2024-03-05');

INSERT INTO orders (customerId, orderStatusId, shippingCarrierId, orderDate, shippedDate, total)
  SELECT 5, 4, 2, '2024-03-22', '2024-03-25', 1950.00
  WHERE NOT EXISTS (SELECT 1 FROM orders WHERE customerId=5 AND orderDate='2024-03-22');

-- ---------------------------------------------------------------------------
-- Order items
-- ---------------------------------------------------------------------------

-- Order 1: 1x Reject Arm Assembly + 4x Photoeye Sensor
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 1, 1, 1, 1240.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=1 AND inventoryId=1);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 1, 3, 4,  185.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=1 AND inventoryId=3);

-- Order 2: 2x Air Jet Manifold
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 2, 5, 2, 475.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=2 AND inventoryId=5);

-- Order 3: 1x Vision Camera Kit + 2x Checkweigher Load Cell + 2x Control Panel I/O Module
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 3, 2, 1, 2850.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=3 AND inventoryId=2);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 3, 7, 2,  395.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=3 AND inventoryId=7);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 3, 6,  2,  620.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=3 AND inventoryId=6);

-- Order 4: 1x Conveyor Belt + 2x Photoeye Sensor + 1x Air Jet Manifold
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 4, 4, 1, 315.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=4 AND inventoryId=4);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 4, 3, 2, 185.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=4 AND inventoryId=3);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 4, 5, 1, 475.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=4 AND inventoryId=5);

-- Order 5: 2x Control Panel I/O Module + 1x Checkweigher Load Cell + 1x Conveyor Belt
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 5, 6, 2, 620.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=5 AND inventoryId=6);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 5, 7, 1, 395.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=5 AND inventoryId=7);
INSERT INTO orderItems (orderId, inventoryId, orderQuantity, unitPrice)
  SELECT 5, 4, 1, 315.00 WHERE NOT EXISTS (SELECT 1 FROM orderItems WHERE orderId=5 AND inventoryId=4);

-- ---------------------------------------------------------------------------
-- Can weights (reference data for tare-weight checks)
-- ---------------------------------------------------------------------------

INSERT INTO canWeights (canType, weight) SELECT '202 Standard Aluminum Can', 0.031 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='202 Standard Aluminum Can');
INSERT INTO canWeights (canType, weight) SELECT '211 Sleek Aluminum Can',    0.029 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='211 Sleek Aluminum Can');
INSERT INTO canWeights (canType, weight) SELECT '307 Tinplate Food Can',     0.086 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='307 Tinplate Food Can');
INSERT INTO canWeights (canType, weight) SELECT '#10 Foodservice Can',       0.287 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='#10 Foodservice Can');
INSERT INTO canWeights (canType, weight) SELECT '16 oz PET Bottle',          0.052 WHERE NOT EXISTS (SELECT 1 FROM canWeights WHERE canType='16 oz PET Bottle');

-- End of schema
