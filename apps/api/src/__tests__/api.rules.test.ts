import request from "supertest";
import app from "../app";

const executeMock = jest.fn();
const queryMock = jest.fn();
const withTransactionMock = jest.fn();

jest.mock("../db/pool", () => ({
  pool: {
    execute: (...args: any[]) => executeMock(...args),
    query: (...args: any[]) => queryMock(...args),
  },
  withTransaction: (...args: any[]) => withTransactionMock(...args),
}));

jest.mock("../utils/jwt", () => ({
  signAccessToken: () => "access-token",
  signRefreshToken: () => "refresh-token",
  verifyAccessToken: () => ({
    userId: 1,
    role: "dispatcher",
    email: "dispatcher@demo.com",
    fullName: "Dispatcher",
  }),
  verifyRefreshToken: () => ({
    userId: 1,
    role: "dispatcher",
    email: "dispatcher@demo.com",
    fullName: "Dispatcher",
  }),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

describe("TransitOps API rules", () => {
  beforeEach(() => {
    executeMock.mockReset();
    queryMock.mockReset();
    withTransactionMock.mockReset();
  });

  it("login flow succeeds", async () => {
    executeMock
      .mockResolvedValueOnce([
        [
          {
            id: 1,
            full_name: "Admin",
            email: "admin@demo.com",
            password_hash: "hash",
            role: "admin",
          },
        ],
      ])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    const res = await request(app).post("/api/auth/login").send({
      email: "admin@demo.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe("access-token");
  });

  it("rejects overweight cargo attempt", async () => {
    queryMock
      .mockResolvedValueOnce([[{ id: 1, max_load_capacity: 500, status: "available" }]])
      .mockResolvedValueOnce([
        [
          {
            id: 1,
            status: "available",
            suspended: 0,
            license_expiry_date: "2099-01-01",
          },
        ],
      ]);

    const res = await request(app)
      .post("/api/trips")
      .set("Authorization", "Bearer token")
      .send({
        source: "A",
        destination: "B",
        vehicleId: 1,
        driverId: 1,
        cargoWeight: 700,
        plannedDistance: 50,
      });

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/Cargo weight exceeds/);
  });

  it("rejects expired license attempt", async () => {
    queryMock
      .mockResolvedValueOnce([[{ id: 1, max_load_capacity: 500, status: "available" }]])
      .mockResolvedValueOnce([
        [
          {
            id: 1,
            status: "available",
            suspended: 0,
            license_expiry_date: "2000-01-01",
          },
        ],
      ]);

    const res = await request(app)
      .post("/api/trips")
      .set("Authorization", "Bearer token")
      .send({
        source: "A",
        destination: "B",
        vehicleId: 1,
        driverId: 1,
        cargoWeight: 400,
        plannedDistance: 50,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Driver is not eligible/);
  });

  it("dispatch succeeds", async () => {
    withTransactionMock.mockImplementation(async (cb: any) => {
      const execute = jest.fn().mockResolvedValue([{}]);
      const query = jest
        .fn()
        .mockResolvedValueOnce([
          [{ id: 10, vehicle_id: 3, driver_id: 7, status: "draft", cargo_weight: 300 }],
        ])
        .mockResolvedValueOnce([[{ id: 3, status: "available", max_load_capacity: 500 }]])
        .mockResolvedValueOnce([
          [{ id: 7, status: "available", suspended: 0, license_expiry_date: "2099-01-01" }],
        ]);

      await cb({ execute, query });
    });

    const res = await request(app)
      .post("/api/trips/10/dispatch")
      .set("Authorization", "Bearer token")
      .send();

    expect(res.status).toBe(204);
  });

  it("rejects double dispatch attempt", async () => {
    withTransactionMock.mockImplementation(async (cb: any) => {
      const execute = jest.fn().mockResolvedValue([{}]);
      const query = jest
        .fn()
        .mockResolvedValueOnce([
          [{ id: 10, vehicle_id: 3, driver_id: 7, status: "dispatched", cargo_weight: 300 }],
        ]);

      await cb({ execute, query });
    });

    const res = await request(app)
      .post("/api/trips/10/dispatch")
      .set("Authorization", "Bearer token")
      .send();

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Only draft trips can be dispatched/);
  });
});
