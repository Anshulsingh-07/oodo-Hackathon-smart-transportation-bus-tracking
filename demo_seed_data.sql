DROP DATABASE IF EXISTS transit;
CREATE DATABASE transit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transit;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);
CREATE INDEX idx_users_role_id ON users(role_id);

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(64) NOT NULL UNIQUE,
  model VARCHAR(120) NOT NULL,
  type VARCHAR(80) NOT NULL,
  max_load_capacity DECIMAL(12,2) NOT NULL,
  odometer DECIMAL(12,2) NOT NULL DEFAULT 0,
  acquisition_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  region VARCHAR(120) NULL,
  status ENUM('available', 'on_trip', 'in_shop', 'retired') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_vehicles_region ON vehicles(region);

CREATE TABLE vehicle_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicle_documents_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);
CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  license_number VARCHAR(80) NOT NULL UNIQUE,
  license_category VARCHAR(40) NOT NULL,
  license_expiry_date DATE NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  email VARCHAR(190) NULL,
  safety_score DECIMAL(5,2) NOT NULL DEFAULT 80,
  status ENUM('available', 'on_trip', 'off_duty', 'suspended') NOT NULL DEFAULT 'available',
  suspended TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_expiry ON drivers(license_expiry_date);

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  cargo_weight DECIMAL(12,2) NOT NULL,
  planned_distance DECIMAL(12,2) NOT NULL,
  actual_distance DECIMAL(12,2) NULL,
  fuel_consumed DECIMAL(12,2) NULL,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'dispatched', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  dispatched_at DATETIME NULL,
  completed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);

CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  maintenance_type VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  opened_at DATETIME NOT NULL,
  closed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
CREATE INDEX idx_maintenance_vehicle_id ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);

CREATE TABLE fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  liters DECIMAL(12,2) NOT NULL,
  cost DECIMAL(14,2) NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_fuel_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
);
CREATE INDEX idx_fuel_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_trip_id ON fuel_logs(trip_id);
CREATE INDEX idx_fuel_log_date ON fuel_logs(log_date);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  category ENUM('toll', 'maintenance', 'fine', 'insurance', 'other') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expenses_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
);
CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id INT NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user_id ON audit_log(user_id);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(500) NOT NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

INSERT INTO roles (id, name) VALUES
  (1, 'admin'),
  (2, 'fleet_manager'),
  (3, 'dispatcher'),
  (4, 'safety_officer'),
  (5, 'financial_analyst');

INSERT INTO users (id, full_name, email, password_hash, role_id, active) VALUES
  (1, 'System Admin', 'admin@transitops.local', '$2b$10$P/IPDybGuPLwbNYND7ibBehVPt7QvsjhsG6spNaiPF5.JLEpk1kLG', 1, 1),
  (2, 'Fleet Manager', 'fleet@transitops.local', '$2b$10$HGiB4XgfOG8t3rShhZuXFeHviYW5xhAvr3NphoEHPGTNVO4NrUlw2', 2, 1),
  (3, 'Dispatch Lead', 'dispatch@transitops.local', '$2b$10$o98mPcqBfoHBCOoBtKw5aO6HrhkrftaWv0UxCLtcUy6o9TuJy09Um', 3, 1),
  (4, 'Safety Officer', 'safety@transitops.local', '$2b$10$EzVUCQQ08z/GPf.LBgsnyuRRgVuRHPjOWa7BqmERifYPulAGYZei6', 4, 1),
  (5, 'Financial Analyst', 'finance@transitops.local', '$2b$10$wTc8iNPJMD3X/48W51zvG.66eaj/rHnT9LL6KUWseghx8yN5DmjiG', 5, 1);

INSERT INTO vehicles (id, registration_number, model, type, max_load_capacity, odometer, acquisition_cost, region, status) VALUES
  (1, 'KA-01-TR-1001', 'Volvo FM 420', 'truck', 5000, 120500, 8500000, 'South', 'available'),
  (2, 'KA-01-TR-1002', 'Tata Ultra 1918', 'truck', 3000, 98500, 5400000, 'South', 'on_trip'),
  (3, 'MH-12-VN-2201', 'Eicher Pro 2110', 'van', 1500, 44200, 3200000, 'West', 'in_shop'),
  (4, 'DL-04-LT-4401', 'Ashok Leyland Boss', 'truck', 4500, 205000, 6900000, 'North', 'retired'),
  (5, 'TN-09-VN-3302', 'Mahindra Blazo X', 'truck', 500, 15600, 2200000, 'South', 'available');

INSERT INTO vehicle_documents (vehicle_id, document_type, file_name, file_path) VALUES
  (1, 'registration_certificate', 'KA-01-TR-1001-rc.pdf', 'uploads/vehicles/KA-01-TR-1001-rc.pdf'),
  (1, 'insurance', 'KA-01-TR-1001-insurance.pdf', 'uploads/vehicles/KA-01-TR-1001-insurance.pdf'),
  (3, 'registration_certificate', 'MH-12-VN-2201-rc.pdf', 'uploads/vehicles/MH-12-VN-2201-rc.pdf');

INSERT INTO drivers (id, name, license_number, license_category, license_expiry_date, contact_number, email, safety_score, status, suspended) VALUES
  (1, 'Arun Kumar', 'DL-AR-9981', 'HMV', DATE_ADD(CURDATE(), INTERVAL 400 DAY), '9990001001', 'arun.kumar@fleetmail.local', 91, 'available', 0),
  (2, 'Priya Singh', 'DL-PR-8802', 'HMV', DATE_ADD(CURDATE(), INTERVAL 200 DAY), '9990001002', 'priya.singh@fleetmail.local', 87, 'on_trip', 0),
  (3, 'Irfan Ali', 'DL-IR-7703', 'LMV', DATE_ADD(CURDATE(), INTERVAL 20 DAY), '9990001003', 'irfan.ali@fleetmail.local', 82, 'off_duty', 0),
  (4, 'Ravi Mehta', 'DL-RV-6604', 'HMV', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '9990001004', 'ravi.mehta@fleetmail.local', 63, 'off_duty', 0),
  (5, 'Neha Joshi', 'DL-NJ-5505', 'HMV', DATE_ADD(CURDATE(), INTERVAL 365 DAY), '9990001005', 'neha.joshi@fleetmail.local', 58, 'suspended', 1);

INSERT INTO trips (id, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, revenue, status, dispatched_at, completed_at, cancelled_at) VALUES
  (1, 'Bengaluru', 'Mysuru', 5, 1, 450, 150, NULL, NULL, 70000, 'draft', NULL, NULL, NULL),
  (2, 'Bengaluru', 'Hyderabad', 2, 2, 1200, 600, NULL, NULL, 240000, 'dispatched', DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, NULL),
  (3, 'Pune', 'Mumbai', 1, 1, 900, 180, 188, 38, 120000, 'completed', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY), NULL),
  (4, 'Delhi', 'Jaipur', 1, 1, 700, 280, NULL, NULL, 90000, 'cancelled', DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, DATE_SUB(NOW(), INTERVAL 19 DAY));

INSERT INTO maintenance_logs (id, vehicle_id, maintenance_type, description, cost, status, opened_at, closed_at) VALUES
  (1, 3, 'engine_check', 'Engine vibration inspection and parts replacement', 18000, 'open', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
  (2, 1, 'tire_rotation', 'Tire replacement and wheel balancing', 9000, 'closed', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY));

INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES
  (1, 3, 38, 4200, DATE_SUB(CURDATE(), INTERVAL 9 DAY)),
  (2, 2, 62, 7450, CURDATE()),
  (5, NULL, 22, 2550, DATE_SUB(CURDATE(), INTERVAL 1 DAY));

INSERT INTO expenses (vehicle_id, trip_id, category, amount, expense_date, notes) VALUES
  (1, 3, 'toll', 1500, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'Expressway tolls'),
  (1, NULL, 'maintenance', 9000, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'Scheduled tire maintenance'),
  (2, 2, 'fine', 1200, CURDATE(), 'Parking compliance penalty'),
  (5, NULL, 'insurance', 5400, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Monthly insurance premium'),
  (3, NULL, 'other', 800, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Workshop cleaning materials');

INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES
  (3, 'trip_dispatch', 'trip', 2, 'Trip 2 dispatched and vehicle 2, driver 2 marked on_trip'),
  (2, 'maintenance_open', 'maintenance', 1, 'Maintenance opened for vehicle 3 and status set to in_shop'),
  (2, 'maintenance_close', 'maintenance', 2, 'Maintenance closed for vehicle 1 and restored to available'),
  (3, 'trip_cancel', 'trip', 4, 'Trip 4 cancelled and resources restored to available'),
  (1, 'trip_complete', 'trip', 3, 'Trip 3 completed and odometer updated');

INSERT INTO notifications (user_id, message) VALUES
  (1, 'Driver Ravi Mehta license is expired and requires immediate action.'),
  (4, 'Driver Irfan Ali license is expiring within 30 days.'),
  (4, 'Driver Ravi Mehta license is expired and requires immediate action.');
