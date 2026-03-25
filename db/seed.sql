PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

DELETE FROM products;
DELETE FROM categories;
DELETE FROM sessions;
DELETE FROM users;
DELETE FROM sqlite_sequence WHERE name IN ('products', 'categories', 'users');

INSERT INTO categories (name) VALUES
  ('Fruit Tea'),
  ('Coffee'),
  ('Milk Tea');

INSERT INTO products (catid, name, price, description, image_path, thumb_path)
VALUES
  ((SELECT catid FROM categories WHERE name = 'Fruit Tea'), 'Peach Oolong Fruit Tea', 26.00, 'Peach aroma with oolong base and a clean finish.', '/uploads/original/1_original.png', '/uploads/thumb/1_thumb.jpg'),
  ((SELECT catid FROM categories WHERE name = 'Fruit Tea'), 'Grapefruit Jasmine Fruit Tea', 25.00, 'Fresh grapefruit with jasmine notes.', '/uploads/original/2_original.png', '/uploads/thumb/2_thumb.jpg'),
  ((SELECT catid FROM categories WHERE name = 'Coffee'), 'Cold Brew Americano', 20.00, 'Slow-steeped cold brew with a clean finish.', '/uploads/original/3_original.png', '/uploads/thumb/3_thumb.jpg'),
  ((SELECT catid FROM categories WHERE name = 'Coffee'), 'Sea Salt Caramel Latte', 32.00, 'Espresso and caramel milk with sea salt foam.', '/uploads/original/4_original.png', '/uploads/thumb/4_thumb.jpg'),
  ((SELECT catid FROM categories WHERE name = 'Milk Tea'), 'Brown Sugar Boba Milk Tea', 28.00, 'Brown sugar boba and creamy milk tea.', '/uploads/original/5_original.png', '/uploads/thumb/5_thumb.jpg'),
  ((SELECT catid FROM categories WHERE name = 'Milk Tea'), 'Matcha Milk Tea', 30.00, 'Smooth matcha blended with milk.', '/uploads/original/6_original.png', '/uploads/thumb/6_thumb.jpg');

INSERT INTO users (email, password, display_name, is_admin)
VALUES
  ('admin@futuredrinks.test', 'scrypt$2c03a647c6e1e97b3381bc295d0fce3d$8dc6019052ce2acf318298f580ebb6c343a5634912dc30a9f5bdd0b8f76da2b949dd47b9747d3d5d807270b620fcdff0563fdb36b76365969460f8e040b8e588', 'Admin User', 1),
  ('user@futuredrinks.test', 'scrypt$e0bd819bc25b4581aec99fbb920d7d2b$9a2c525dd33fddaa59fb2490e4bf9c4138622cb4270654f5e21f1d48cd5944c180b04b8dfdecde3e74ce62e26af0429dbc0364ab4663a17981c28cf0a1c03eec', 'Normal User', 0);

COMMIT;
