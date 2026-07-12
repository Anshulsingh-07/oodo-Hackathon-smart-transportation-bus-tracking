import { createConnection } from 'typeorm';
import { User } from '../apps/api/src/models/User'; // Adjust the import based on your models
import { Vehicle } from '../apps/api/src/models/Vehicle'; // Adjust the import based on your models
import { Trip } from '../apps/api/src/models/Trip'; // Adjust the import based on your models

async function migrate() {
    const connection = await createConnection();

    // Example migration: Create tables if they do not exist
    await connection.synchronize();

    // Example: Add initial data if necessary
    const user = new User();
    user.name = 'Admin';
    user.email = 'admin@example.com';
    user.password = 'securepassword'; // Hash this in a real application
    await connection.manager.save(user);

    const vehicle = new Vehicle();
    vehicle.model = 'Bus';
    vehicle.licensePlate = 'XYZ 1234';
    await connection.manager.save(vehicle);

    const trip = new Trip();
    trip.vehicle = vehicle;
    trip.startLocation = 'Station A';
    trip.endLocation = 'Station B';
    trip.startTime = new Date();
    await connection.manager.save(trip);

    console.log('Migration completed successfully.');
    await connection.close();
}

migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});