import { db } from './index';
import {
    user,
    serviceCategory,
    service,
    employee,
    customer,
    chair,
    shift,
    commissionRule
} from './schema';
import { nanoid } from 'nanoid';

async function seed() {
    console.log('🌱 Seeding database...');

    // Seed users
    const users = await db.insert(user).values([
        {
            id: nanoid(),
            name: 'Admin User',
            email: 'admin@barbershop.com',
            role: 'ADMIN',
            phone: '+62812345678',
            isActive: true,
            emailVerified: true,
        },
        {
            id: nanoid(),
            name: 'Kasir Satu',
            email: 'kasir1@barbershop.com',
            role: 'CASHIER',
            phone: '+62812345679',
            isActive: true,
            emailVerified: true,
        },
        {
            id: nanoid(),
            name: 'Kasir Dua',
            email: 'kasir2@barbershop.com',
            role: 'CASHIER',
            phone: '+62812345680',
            isActive: true,
            emailVerified: true,
        },
        {
            id: nanoid(),
            name: 'Manager Owner',
            email: 'owner@barbershop.com',
            role: 'STAKEHOLDER',
            phone: '+62812345681',
            isActive: true,
            emailVerified: true,
        }
    ]).returning();

    console.log(`✅ Created ${users.length} users`);

    // Seed service categories
    const categories = await db.insert(serviceCategory).values([
        {
            id: nanoid(),
            name: 'Potong Rambut',
            description: 'Layanan potong rambut untuk semua usia',
            order: 1,
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Perawatan',
            description: 'Layanan perawatan rambut dan wajah',
            order: 2,
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Styling',
            description: 'Layanan styling rambut khusus',
            order: 3,
            isActive: true,
        }
    ]).returning();

    console.log(`✅ Created ${categories.length} service categories`);

    // Seed services
    const services = await db.insert(service).values([
        // Potong Rambut
        {
            id: nanoid(),
            categoryId: categories[0].id,
            name: 'Potong Rambut Anak',
            code: 'PRA001',
            basePrice: '30000',
            duration: 30,
            commissionType: 'PERCENT',
            commissionValue: '20',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[0].id,
            name: 'Potong Rambut Dewasa',
            code: 'PRD001',
            basePrice: '50000',
            duration: 45,
            commissionType: 'PERCENT',
            commissionValue: '25',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[0].id,
            name: 'Potong Rambut Premium',
            code: 'PRP001',
            basePrice: '80000',
            duration: 60,
            commissionType: 'PERCENT',
            commissionValue: '30',
            isActive: true,
        },

        // Perawatan
        {
            id: nanoid(),
            categoryId: categories[1].id,
            name: 'Cuci Rambut',
            code: 'CR001',
            basePrice: '20000',
            duration: 20,
            commissionType: 'PERCENT',
            commissionValue: '15',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[1].id,
            name: 'Creambath',
            code: 'CB001',
            basePrice: '60000',
            duration: 45,
            commissionType: 'PERCENT',
            commissionValue: '20',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[1].id,
            name: 'Hair Mask',
            code: 'HM001',
            basePrice: '75000',
            duration: 60,
            commissionType: 'PERCENT',
            commissionValue: '25',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[1].id,
            name: 'Hair Spa',
            code: 'HS001',
            basePrice: '90000',
            duration: 75,
            commissionType: 'PERCENT',
            commissionValue: '30',
            isActive: true,
        },

        // Styling
        {
            id: nanoid(),
            categoryId: categories[2].id,
            name: 'Blow',
            code: 'B001',
            basePrice: '25000',
            duration: 25,
            commissionType: 'PERCENT',
            commissionValue: '15',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[2].id,
            name: 'Smoothing',
            code: 'S001',
            basePrice: '250000',
            duration: 180,
            commissionType: 'FLAT',
            commissionValue: '50000',
            isActive: true,
        },
        {
            id: nanoid(),
            categoryId: categories[2].id,
            name: 'Kerating',
            code: 'K001',
            basePrice: '350000',
            duration: 210,
            commissionType: 'FLAT',
            commissionValue: '75000',
            isActive: true,
        }
    ]).returning();

    console.log(`✅ Created ${services.length} services`);

    // Seed employees
    const employees = await db.insert(employee).values([
        {
            id: nanoid(),
            name: 'Andi Pratama',
            code: 'EMP001',
            level: 'MASTER',
            phone: '+62811111111',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Budi Santoso',
            code: 'EMP002',
            level: 'SENIOR',
            phone: '+62811111112',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Chandra Wijaya',
            code: 'EMP003',
            level: 'SENIOR',
            phone: '+62811111113',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Dedi Kurniawan',
            code: 'EMP004',
            level: 'JUNIOR',
            phone: '+62811111114',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Eko Prasetyo',
            code: 'EMP005',
            level: 'JUNIOR',
            phone: '+62811111115',
            isActive: true,
        }
    ]).returning();

    console.log(`✅ Created ${employees.length} employees`);

    // Seed customers
    const customers = await db.insert(customer).values([
        {
            id: nanoid(),
            name: 'Ahmad Rizki',
            phone: '+62821111111',
            type: 'REGULAR',
        },
        {
            id: nanoid(),
            name: 'Bambang Sutrisno',
            phone: '+62821111112',
            type: 'MEMBER',
            notes: 'Pelanggan setia, datang 2x sebulan',
        },
        {
            id: nanoid(),
            name: 'Cahyo Purnomo',
            phone: '+62821111113',
            type: 'VIP',
            notes: 'Pemilik usaha tetangga, selalu bayar cash',
        },
        {
            id: nanoid(),
            name: 'Doni Kusumo',
            phone: '+62821111114',
            type: 'REGULAR',
        },
        {
            id: nanoid(),
            name: 'Eko Nugroho',
            phone: '+62821111115',
            type: 'MEMBER',
            notes: 'Preferensi: potong dengan Andi',
        }
    ]).returning();

    console.log(`✅ Created ${customers.length} customers`);

    // Seed chairs
    const chairs = await db.insert(chair).values([
        {
            id: nanoid(),
            name: 'Kursi 1',
            location: 'Dekat jendela',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Kursi 2',
            location: 'Tengah',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Kursi 3',
            location: 'Dekat pintu',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Kursi VIP',
            location: 'Khusus premium',
            isActive: true,
        }
    ]).returning();

    console.log(`✅ Created ${chairs.length} chairs`);

    // Seed shifts
    const shifts = await db.insert(shift).values([
        {
            id: nanoid(),
            name: 'Shift Pagi',
            startTime: '08:00',
            endTime: '16:00',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Shift Sore',
            startTime: '16:00',
            endTime: '00:00',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Shift Malam',
            startTime: '19:00',
            endTime: '02:00',
            isActive: false, // Not currently used
        }
    ]).returning();

    console.log(`✅ Created ${shifts.length} shifts`);

    // Seed commission rules
    const commissionRules = await db.insert(commissionRule).values([
        // Global rules (fallback)
        {
            id: nanoid(),
            name: 'Default Global - 20%',
            scope: 'GLOBAL',
            type: 'PERCENT',
            value: '20',
            isActive: true,
        },

        // Employee level rules
        {
            id: nanoid(),
            name: 'Junior Level - 15%',
            scope: 'EMPLOYEE_LEVEL',
            scopeId: 'JUNIOR',
            type: 'PERCENT',
            value: '15',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Senior Level - 25%',
            scope: 'EMPLOYEE_LEVEL',
            scopeId: 'SENIOR',
            type: 'PERCENT',
            value: '25',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Master Level - 30%',
            scope: 'EMPLOYEE_LEVEL',
            scopeId: 'MASTER',
            type: 'PERCENT',
            value: '30',
            isActive: true,
        },

        // Specific service rules (highest priority)
        {
            id: nanoid(),
            name: 'Smoothing Special - Fix Rp 50.000',
            scope: 'SERVICE',
            scopeId: services.find(s => s.code === 'S001')?.id || '',
            type: 'FLAT',
            value: '50000',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Kerating Special - Fix Rp 75.000',
            scope: 'SERVICE',
            scopeId: services.find(s => s.code === 'K001')?.id || '',
            type: 'FLAT',
            value: '75000',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Potong Premium - 35%',
            scope: 'SERVICE',
            scopeId: services.find(s => s.code === 'PRP001')?.id || '',
            type: 'PERCENT',
            value: '35',
            isActive: true,
        }
    ]).returning();

    console.log(`✅ Created ${commissionRules.length} commission rules`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Service Categories: ${categories.length}`);
    console.log(`- Services: ${services.length}`);
    console.log(`- Employees: ${employees.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Chairs: ${chairs.length}`);
    console.log(`- Shifts: ${shifts.length}`);
    console.log(`- Commission Rules: ${commissionRules.length}`);
}

// Run seed function
seed().catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
});