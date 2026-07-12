import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Seed users
    const user1 = await prisma.user.create({
        data: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            password: 'hashed_password_1', // Use a proper hashing method
        },
    });

    const user2 = await prisma.user.create({
        data: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            password: 'hashed_password_2', // Use a proper hashing method
        },
    });

    // Seed vehicles
    const vehicle1 = await prisma.vehicle.create({
        data: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            ownerId: user1.id,
        },
    });

    const vehicle2 = await prisma.vehicle.create({
        data: {
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            ownerId: user2.id,
        },
    });

    console.log({ user1, user2, vehicle1, vehicle2 });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });