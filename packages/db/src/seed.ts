import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { hash } from 'bcrypt';
import { sql } from 'drizzle-orm';
import * as schema from './schema/index';

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🌱 Seeding database...');

  const [cakes, cupcakes, macarons] = await db
    .insert(schema.categories)
    .values([
      { name: 'Торты', slug: 'torty' },
      { name: 'Капкейки', slug: 'kapkejki' },
      { name: 'Макаронс', slug: 'makarons' },
    ])
    .onConflictDoUpdate({ target: schema.categories.slug, set: { name: sql`excluded.name` } })
    .returning();
  console.log('✅ Categories');

  const [birthday, wedding, kids, corporate, anniversary] = await db
    .insert(schema.occasions)
    .values([
      { name: 'День рождения', slug: 'den-rozhdeniya' },
      { name: 'Свадьба', slug: 'svadba' },
      { name: 'Детский праздник', slug: 'detskij-prazdnik' },
      { name: 'Корпоратив', slug: 'korporativ' },
      { name: 'Юбилей', slug: 'yubilej' },
    ])
    .onConflictDoUpdate({ target: schema.occasions.slug, set: { name: sql`excluded.name` } })
    .returning();
  console.log('✅ Occasions');

  const seededProducts = await db
    .insert(schema.products)
    .values([
      {
        slug: 'shokoladnyj-tort',
        name: 'Шоколадный торт',
        description: 'Нежный шоколадный бисквит с шоколадным ганашем и свежими ягодами',
        composition: 'Шоколадный бисквит, ганаш, сливки, свежие ягоды',
        pricePerKg: 180000,
        minWeight: '1.0',
        maxWeight: '5.0',
        categoryId: cakes.id,
      },
      {
        slug: 'vanilnyj-tort',
        name: 'Ванильный торт',
        description: 'Классический ванильный бисквит с нежным сливочным кремом',
        composition: 'Ванильный бисквит, сливочный крем, белый шоколад',
        pricePerKg: 160000,
        minWeight: '1.0',
        maxWeight: '5.0',
        categoryId: cakes.id,
      },
      {
        slug: 'red-velvet',
        name: 'Красный бархат',
        description: 'Яркий бисквит красный бархат с кремом из сливочного сыра',
        composition: 'Бисквит красный бархат, крем-чиз, сливки',
        pricePerKg: 200000,
        minWeight: '1.0',
        maxWeight: '4.0',
        categoryId: cakes.id,
      },
      {
        slug: 'medovik',
        name: 'Медовик',
        description: 'Классический медовый торт с нежным сметанным кремом',
        composition: 'Медовые коржи, сметанный крем, грецкий орех',
        pricePerKg: 150000,
        minWeight: '1.0',
        maxWeight: '3.0',
        categoryId: cakes.id,
      },
      {
        slug: 'kapkejki-vanilnye',
        name: 'Капкейки ванильные',
        description: 'Набор из 6 ванильных капкейков с кремовой шапочкой',
        composition: 'Ванильный бисквит, сливочный крем, посыпка',
        pricePerKg: 250000,
        minWeight: '0.5',
        maxWeight: '2.0',
        weightStep: '0.5',
        categoryId: cupcakes.id,
      },
      {
        slug: 'makarons-assort',
        name: 'Макаронс ассорти',
        description: 'Набор из 12 макаронс разных вкусов',
        composition: 'Миндальная мука, белок, сахар, начинки ассорти',
        pricePerKg: 350000,
        minWeight: '0.3',
        maxWeight: '1.0',
        weightStep: '0.1',
        categoryId: macarons.id,
      },
    ])
    .onConflictDoUpdate({ target: schema.products.slug, set: { name: sql`excluded.name` } })
    .returning();
  console.log('✅ Products');

  await db.insert(schema.productOccasions).values([
    { productId: seededProducts[0].id, occasionId: birthday.id },
    { productId: seededProducts[0].id, occasionId: anniversary.id },
    { productId: seededProducts[1].id, occasionId: birthday.id },
    { productId: seededProducts[1].id, occasionId: kids.id },
    { productId: seededProducts[2].id, occasionId: wedding.id },
    { productId: seededProducts[2].id, occasionId: anniversary.id },
    { productId: seededProducts[3].id, occasionId: birthday.id },
    { productId: seededProducts[3].id, occasionId: corporate.id },
    { productId: seededProducts[4].id, occasionId: kids.id },
    { productId: seededProducts[4].id, occasionId: birthday.id },
    { productId: seededProducts[5].id, occasionId: corporate.id },
  ]).onConflictDoNothing();
  console.log('✅ Product-Occasions');

  const basesCount = await db.select({ n: sql<number>`count(*)::int` }).from(schema.constructorBases);
  if (basesCount[0].n === 0) {
    await db.insert(schema.constructorBases).values([
      { name: 'Ванильный', pricePerKg: 80000, color: '#F5E6C8', sortOrder: 1 },
      { name: 'Шоколадный', pricePerKg: 90000, color: '#5C3A21', sortOrder: 2 },
      { name: 'Красный бархат', pricePerKg: 100000, color: '#8B2252', sortOrder: 3 },
    ]);
  }
  console.log('✅ Constructor Bases');

  const fillingsCount = await db.select({ n: sql<number>`count(*)::int` }).from(schema.constructorFillings);
  if (fillingsCount[0].n === 0) {
    await db.insert(schema.constructorFillings).values([
      { name: 'Клубника-крем', description: 'Нежный клубничный мусс со сливками', pricePerKg: 40000, sortOrder: 1 },
      { name: 'Карамель-орех', description: 'Солёная карамель с грецким орехом', pricePerKg: 45000, sortOrder: 2 },
      { name: 'Шоколад-вишня', description: 'Шоколадный ганаш с вишнёвым конфитюром', pricePerKg: 50000, sortOrder: 3 },
    ]);
  }
  console.log('✅ Constructor Fillings');

  const coatingsCount = await db.select({ n: sql<number>`count(*)::int` }).from(schema.constructorCoatings);
  if (coatingsCount[0].n === 0) {
    await db.insert(schema.constructorCoatings).values([
      { name: 'Крем', type: 'cream', pricePerKg: 20000, roughness: '0.40', sortOrder: 1 },
      { name: 'Мастика', type: 'fondant', pricePerKg: 35000, roughness: '0.80', sortOrder: 2 },
    ]);
  }
  console.log('✅ Constructor Coatings');

  const decoCount = await db.select({ n: sql<number>`count(*)::int` }).from(schema.constructorDecorations);
  if (decoCount[0].n === 0) {
    await db.insert(schema.constructorDecorations).values([
      { name: 'Клубника', category: 'berries', pricePerUnit: 5000, sortOrder: 1 },
      { name: 'Голубика', category: 'berries', pricePerUnit: 6000, sortOrder: 2 },
      { name: 'Малина', category: 'berries', pricePerUnit: 5500, sortOrder: 3 },
      { name: 'Шоколадный шар', category: 'chocolate', pricePerUnit: 8000, sortOrder: 4 },
      { name: 'Трюфель', category: 'chocolate', pricePerUnit: 7000, sortOrder: 5 },
      { name: 'Топпер "С днём рождения"', category: 'toppers', pricePerUnit: 20000, sortOrder: 6 },
      { name: 'Топпер "Love"', category: 'toppers', pricePerUnit: 20000, sortOrder: 7 },
      { name: 'Роза', category: 'flowers', pricePerUnit: 10000, sortOrder: 8 },
      { name: 'Сердце', category: 'figures', pricePerUnit: 12000, sortOrder: 9 },
      { name: 'Звезда', category: 'figures', pricePerUnit: 10000, sortOrder: 10 },
    ]);
  }
  console.log('✅ Constructor Decorations');

  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD env var must be set in production');
  }
  const passwordHash = await hash(adminPassword, 10);
  await db.insert(schema.users).values({
    name: 'Администратор',
    email: 'admin@bakery.ru',
    phone: '+79001234567',
    passwordHash,
    role: 'admin',
  }).onConflictDoNothing();
  console.log('✅ Admin user (admin@bakery.ru)');

  const reviewsCount = await db.select({ n: sql<number>`count(*)::int` }).from(schema.reviews);
  if (reviewsCount[0].n === 0) {
    await db.insert(schema.reviews).values([
      {
        authorName: 'Мария И.',
        text: 'Заказывала торт на день рождения дочки — восторг! Красивый, вкусный, свежий. Спасибо!',
        rating: 5,
      },
      {
        authorName: 'Алексей П.',
        text: 'Отличный медовик, как у бабушки. Конструктор тортов — очень удобная штука.',
        rating: 5,
      },
      {
        authorName: 'Елена С.',
        text: 'Красный бархат — просто бомба! Заказываю уже третий раз, всегда на высоте.',
        rating: 4,
      },
    ]);
  }
  console.log('✅ Reviews');

  console.log('\n🎉 Seeding complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
