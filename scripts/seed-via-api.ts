
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed users
    console.log('👥 Creating test users...');
    const users = [
      { id: 'consumer-1', email: 'john.consumer@test.com', role: 'consumer', full_name: 'John Doe', phone_number: '+2348012345671' },
      { id: 'merchant-1', email: 'fresh.market@test.com', role: 'merchant', full_name: 'Fresh Market Lagos', phone_number: '+2348012345681' },
      { id: 'driver-1', email: 'driver1@test.com', role: 'driver', full_name: 'Michael Driver', phone_number: '+2348012345691' },
    ];

    for (const user of users) {
      const { error } = await supabase.from('users').upsert(user);
      if (error) console.error(`Error creating user ${user.email}:`, error.message);
    }

    // Seed merchant profiles
    console.log('🏪 Creating merchant profiles...');
    const { error: merchantError } = await supabase.from('merchant_profiles').upsert({
      user_id: 'merchant-1',
      business_name: 'Fresh Market Lagos',
      business_type: 'Supermarket',
      address: '123 Admiralty Way, Lekki',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4531,
      longitude: 3.4201,
      is_verified: true,
      rating: 4.5,
      total_reviews: 120
    });

    if (merchantError) console.error('Error creating merchant:', merchantError.message);

    // Seed commodities
    console.log('📦 Creating commodities...');
    const commodities = [
      {
        merchant_id: 'merchant-1',
        name: 'Fresh Tomatoes',
        description: 'Locally sourced ripe tomatoes',
        category: 'Vegetables',
        price: 500.00,
        unit: 'kg',
        stock_quantity: 150,
        is_available: true
      },
      {
        merchant_id: 'merchant-1',
        name: 'White Rice',
        description: 'Premium quality long grain rice',
        category: 'Grains',
        price: 15000.00,
        unit: '50kg bag',
        stock_quantity: 80,
        is_available: true
      }
    ];

    for (const commodity of commodities) {
      const { error } = await supabase.from('commodities').upsert(commodity);
      if (error) console.error(`Error creating commodity ${commodity.name}:`, error.message);
    }

    console.log('✅ Database seeded successfully!');
    console.log('📈 Created test users, merchants, and commodities');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
