import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_VJih5mNw6Oye@ep-aged-darkness-acjhbj4a-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

async function initDatabase() {
  console.log('🚀 Initializing database...');

  try {
    // Test connection
    const test = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connected to Neon.tech:', test[0].current_time);

    // Create tables one by one
    console.log('📝 Creating categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL DEFAULT '#22D3EE',
        icon VARCHAR(50) DEFAULT 'folder',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating products table...');
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        barcode VARCHAR(50),
        category_id UUID REFERENCES categories(id),
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 5,
        image_url TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating suppliers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        ruc VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'cashier',
        avatar_url TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating sales table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
        cashier_id UUID REFERENCES users(id),
        cash_register_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating sale_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sale_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating purchases table...');
    await sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES suppliers(id),
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('📝 Creating purchase_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_cost DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL
      )
    `;

    console.log('📝 Creating cash_registers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS cash_registers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        closing_amount DECIMAL(10, 2),
        cashier_id UUID REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        closed_at TIMESTAMP WITH TIME ZONE
      )
    `;

    console.log('📝 Creating settings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('✅ All tables created successfully!');

    // Insert default data
    console.log('📦 Inserting default categories...');

    // Check if categories exist
    const existingCats = await sql`SELECT COUNT(*) as count FROM categories`;
    if (existingCats[0].count === '0') {
      await sql`INSERT INTO categories (name, color, icon) VALUES ('Bebidas', '#22D3EE', 'coffee')`;
      await sql`INSERT INTO categories (name, color, icon) VALUES ('Snacks', '#FBBF24', 'cookie')`;
      await sql`INSERT INTO categories (name, color, icon) VALUES ('Lácteos', '#4ADE80', 'milk')`;
      await sql`INSERT INTO categories (name, color, icon) VALUES ('Panadería', '#F87171', 'croissant')`;
      await sql`INSERT INTO categories (name, color, icon) VALUES ('Dulces', '#A78BFA', 'candy')`;
      await sql`INSERT INTO categories (name, color, icon) VALUES ('Limpieza', '#FB923C', 'spray-can')`;
      console.log('✅ Categories inserted!');
    } else {
      console.log('⏭️ Categories already exist, skipping...');
    }

    console.log('👤 Inserting default admin user...');
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
    if (existingUsers[0].count === '0') {
      await sql`INSERT INTO users (name, email, password_hash, role) VALUES ('Admin Principal', 'admin@kiosko.com', 'admin123', 'admin')`;
      await sql`INSERT INTO users (name, email, password_hash, role) VALUES ('María García', 'maria@kiosko.com', 'maria123', 'cashier')`;
      await sql`INSERT INTO users (name, email, password_hash, role) VALUES ('Carlos López', 'carlos@kiosko.com', 'carlos123', 'manager')`;
      console.log('✅ Users inserted!');
    } else {
      console.log('⏭️ Users already exist, skipping...');
    }

    console.log('🏢 Inserting default suppliers...');
    const existingSuppliers = await sql`SELECT COUNT(*) as count FROM suppliers`;
    if (existingSuppliers[0].count === '0') {
      await sql`INSERT INTO suppliers (name, ruc, phone, email, address) VALUES ('Distribuidora Central', '20123456789', '+51 999 888 777', 'ventas@central.com', 'Av. Industrial 123')`;
      await sql`INSERT INTO suppliers (name, ruc, phone, email, address) VALUES ('Bebidas del Norte', '20987654321', '+51 988 777 666', 'pedidos@bebidasnorte.com', 'Jr. Comercio 456')`;
      await sql`INSERT INTO suppliers (name, ruc, phone, email, address) VALUES ('Lácteos Premium', '20456789123', '+51 977 666 555', 'info@lacteospremium.com', 'Calle Lechera 789')`;
      console.log('✅ Suppliers inserted!');
    } else {
      console.log('⏭️ Suppliers already exist, skipping...');
    }

    // Insert sample products
    console.log('📦 Inserting sample products...');
    const existingProducts = await sql`SELECT COUNT(*) as count FROM products`;
    if (existingProducts[0].count === '0') {
      const categories = await sql`SELECT id, name FROM categories`;
      const catMap = {};
      categories.forEach(c => catMap[c.name] = c.id);

      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Coca Cola 500ml', '7891234567890', ${catMap['Bebidas']}, 2.50, 1.80, 48, 12, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Pepsi 500ml', '7891234567891', ${catMap['Bebidas']}, 2.30, 1.60, 36, 12, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Agua Mineral 600ml', '7891234567892', ${catMap['Bebidas']}, 1.50, 0.80, 60, 24, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Doritos 150g', '7891234567893', ${catMap['Snacks']}, 3.50, 2.50, 24, 10, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Lays Clásicas 150g', '7891234567894', ${catMap['Snacks']}, 3.20, 2.30, 20, 10, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Leche Entera 1L', '7891234567895', ${catMap['Lácteos']}, 1.80, 1.20, 30, 15, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Yogurt Natural 1L', '7891234567896', ${catMap['Lácteos']}, 2.80, 2.00, 18, 8, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Pan de Molde', '7891234567897', ${catMap['Panadería']}, 2.20, 1.50, 15, 5, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Croissant', '7891234567898', ${catMap['Panadería']}, 1.50, 0.90, 20, 8, true)`;
      await sql`INSERT INTO products (name, barcode, category_id, price, cost, stock, min_stock, active) VALUES ('Chocolate Snickers', '7891234567899', ${catMap['Dulces']}, 1.80, 1.20, 40, 15, true)`;
      console.log('✅ Products inserted!');
    } else {
      console.log('⏭️ Products already exist, skipping...');
    }

    console.log('');
    console.log('🎉 ============================================');
    console.log('🎉 Database initialization complete!');
    console.log('🎉 ============================================');

    // Show summary
    const summary = await sql`
      SELECT
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM suppliers) as suppliers
    `;
    console.log('');
    console.log('📊 Database Summary:');
    console.log(`   • Categories: ${summary[0].categories}`);
    console.log(`   • Products: ${summary[0].products}`);
    console.log(`   • Users: ${summary[0].users}`);
    console.log(`   • Suppliers: ${summary[0].suppliers}`);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
