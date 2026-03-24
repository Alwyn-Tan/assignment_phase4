PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

DELETE FROM products;
DELETE FROM categories;
DELETE FROM sqlite_sequence WHERE name IN ('products', 'categories');

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

COMMIT;
