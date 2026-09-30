import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { Review } from '../models/review.model.js';
import { ROLES } from '../constants/roles.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Purging old database records...');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});

    logger.info('Seeding Users...');
    // 1. Admin User
    const admin = await User.create({
      name: env.seedAdmin.name,
      email: env.seedAdmin.email,
      password: env.seedAdmin.password,
      role: ROLES.ADMIN,
      phone: '+1 555-0199'
    });

    // 2. Customer User
    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@example.com',
      password: 'Customer123!',
      role: ROLES.CUSTOMER,
      phone: '+1 555-0144',
      addresses: [
        {
          fullName: 'John Doe',
          phone: '+1 555-0144',
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          postalCode: '97477',
          country: 'US',
          isDefault: true
        }
      ]
    });

    logger.info('Seeding Categories...');
    const catElectronics = await Category.create({
      name: 'Electronics',
      description: 'Consumer electronics and modern gadgets'
    });

    const catAudio = await Category.create({
      name: 'Audio & Headphones',
      description: 'Studio monitors, noise-canceling headphones, and earbuds',
      parentCategory: catElectronics._id
    });

    const catSmartphones = await Category.create({
      name: 'Smartphones & Tablets',
      description: 'Next-generation mobile devices and accessories',
      parentCategory: catElectronics._id
    });

    const catComputers = await Category.create({
      name: 'Laptops & Computers',
      description: 'High performance ultrabooks and workstations',
      parentCategory: catElectronics._id
    });

    logger.info('Seeding Products...');
    const products = await Product.create([
      {
        name: 'AcousticPro Wireless Noise-Cancelling Headphones',
        description: 'Industry-leading active noise cancellation with 40-hour battery life, high-res audio drivers, and ultra-plush memory foam earcups.',
        price: 299.99,
        discountPrice: 249.99,
        sku: 'APRO-WNC-001',
        category: catAudio._id,
        brand: 'SoundCraft',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'
        ],
        stock: 45,
        tags: ['audio', 'wireless', 'bluetooth', 'anc'],
        attributes: { color: 'Matte Black', connectivity: 'Bluetooth 5.3' }
      },
      {
        name: 'Apex UltraBook Pro 16" M3',
        description: 'Sleek aerospace-grade aluminum chassis powered by 12-core processor, 32GB unified RAM, and 1TB NVMe PCIe 4.0 SSD with Liquid Retina display.',
        price: 1899.0,
        discountPrice: 1749.0,
        sku: 'APEX-UB16-002',
        category: catComputers._id,
        brand: 'ApexTech',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'
        ],
        stock: 18,
        tags: ['laptop', 'computer', 'ultrabook', 'performance'],
        attributes: { ram: '32GB', storage: '1TB SSD', display: '16 inch' }
      },
      {
        name: 'Titan Horizon 5G Flagship Smartphone',
        description: '6.7-inch 120Hz LTPO AMOLED display, triple 50MP Sony sensor camera system, 5000mAh battery with 100W HyperCharge.',
        price: 899.99,
        discountPrice: 0,
        sku: 'TTN-HZ5G-003',
        category: catSmartphones._id,
        brand: 'TitanMobile',
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
        ],
        stock: 30,
        tags: ['phone', '5g', 'smartphone', 'flagship'],
        attributes: { color: 'Phantom Silver', storage: '256GB' }
      },
      {
        name: 'SonicBlast Portable Bluetooth Speaker',
        description: 'IPX7 waterproof rugged portable speaker with 360-degree immersive sound and 24-hour non-stop playback.',
        price: 79.99,
        discountPrice: 59.99,
        sku: 'SB-SPK-004',
        category: catAudio._id,
        brand: 'SoundCraft',
        images: [
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80'
        ],
        stock: 60,
        tags: ['speaker', 'audio', 'waterproof', 'outdoor'],
        attributes: { color: 'Midnight Blue' }
      },
      {
        name: 'ProGlide Mechanical Gaming Keyboard',
        description: 'Hot-swappable tactile mechanical switches, per-key RGB backlighting, aircraft aluminum frame, and detachable USB-C braided cable.',
        price: 129.99,
        discountPrice: 109.99,
        sku: 'PG-KB-005',
        category: catComputers._id,
        brand: 'ApexTech',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
        ],
        stock: 25,
        tags: ['keyboard', 'gaming', 'rgb', 'mechanical'],
        attributes: { switchType: 'Brown Tactile' }
      }
    ]);

    logger.info('Seeding Verified Reviews...');
    await Review.create({
      user: customer._id,
      product: products[0]._id,
      rating: 5,
      title: 'Best noise cancellation I have experienced!',
      comment: 'Audio clarity is pristine, battery life lasts a full work week, and they are incredibly comfortable for long sessions.',
      isVerifiedPurchase: true
    });

    await Review.create({
      user: customer._id,
      product: products[1]._id,
      rating: 5,
      title: 'Powerhouse machine for software engineering',
      comment: 'Compiles massive codebases in seconds. Silent fans and the screen colors are stunning.',
      isVerifiedPurchase: true
    });

    logger.info('✅ Database seeded successfully!');
    logger.info(`Admin Email: ${admin.email} | Password: ${env.seedAdmin.password}`);
    logger.info(`Customer Email: ${customer.email} | Password: Customer123!`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();
