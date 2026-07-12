export interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    status: 'available' | 'in-use' | 'maintenance';
}

export interface Driver {
    id: string;
    name: string;
    licenseNumber: string;
    phoneNumber: string;
    email: string;
    status: 'active' | 'inactive';
}

export interface Trip {
    id: string;
    vehicleId: string;
    driverId: string;
    startTime: Date;
    endTime: Date;
    origin: string;
    destination: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
}

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    role: 'admin' | 'driver' | 'dispatcher';
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}