import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the route
const prismaMock = vi.hoisted(() => ({
  customer: {
    upsert: vi.fn(),
  },
  vehicle: {
    upsert: vi.fn(),
  },
  booking: {
    create: vi.fn(),
  },
}));

// Mock external dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/send-booking-email", () => ({
  sendBookingEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock @upstash/ratelimit to avoid external dependency
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 3600000,
    }),
  })),
  Redis: { fromEnv: vi.fn() },
}));

// Ensure UPSTASH_REDIS_REST_URL is not set so we use in-memory store
delete process.env.UPSTASH_REDIS_REST_URL;

import { POST } from "@/app/api/booking/route";
import { sendBookingEmail } from "@/lib/send-booking-email";
import { logger } from "@/lib/logger";

let ipCounter = 1;
function createMockRequest(body: Record<string, any>, ip?: string) {
  const finalIp = ip || `192.168.2.${ipCounter++}`;
  const formData = new FormData();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  Object.entries(body).forEach(([key, value]) => {
    let val = value;
    if (key === "date" && value === "2024-12-25") {
      val = tomorrowStr;
    }
    if (typeof val === "string") {
      formData.append(key, val);
    } else if (val instanceof File) {
      formData.append(key, val);
    }
  });

  return {
    formData: async () => formData,
    headers: new Map([
      ["x-forwarded-for", finalIp],
    ]),
  } as unknown as Request;
}

describe("POST /api/booking - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = undefined; // Use in-memory rate limiter
  });

  describe("Happy Path - Valid Booking Submission", () => {
    it("should create a booking with valid data", async () => {
      const customerId = "cust-1";
      const vehicleId = "veh-1";
      const bookingId = "book-1";

      prismaMock.customer.upsert.mockResolvedValueOnce({ id: customerId });
      prismaMock.vehicle.upsert.mockResolvedValueOnce({ id: vehicleId });
      prismaMock.booking.create.mockResolvedValueOnce({ id: bookingId });

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "Please be careful with the leather",
      }, "10.0.0.1");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
      expect(prismaMock.customer.upsert).toHaveBeenCalled();
      expect(prismaMock.vehicle.upsert).toHaveBeenCalled();
      expect(prismaMock.booking.create).toHaveBeenCalled();
      expect(sendBookingEmail).toHaveBeenCalled();
    });

    it("should upsert customer with correct data", async () => {
      const customerId = "cust-1";
      const vehicleId = "veh-1";
      const bookingId = "book-1";

      prismaMock.customer.upsert.mockResolvedValueOnce({ id: customerId });
      prismaMock.vehicle.upsert.mockResolvedValueOnce({ id: vehicleId });
      prismaMock.booking.create.mockResolvedValueOnce({ id: bookingId });

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "jane@example.com",
        name: "Jane Smith",
        phone: "555-5678",
        address: "456 Oak Ave",
        city: "Boulder",
        zip: "80301",
        date: "2024-12-25",
        timeWindow: "afternoon",
        notes: "",
      }, "10.0.0.2");

      await POST(request);

      expect(prismaMock.customer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "jane@example.com" },
          create: expect.objectContaining({
            email: "jane@example.com",
            name: "Jane Smith",
            phone: "555-5678",
            address: "456 Oak Ave",
            city: "Boulder",
            zip: "80301",
          }),
        })
      );
    });
  });

  describe("Validation - Invalid Email", () => {
    it("should return 400 for invalid email", async () => {
      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "not-an-email",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      }, "10.0.0.3");

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("validation");
      expect(data.fieldErrors.email).toBeDefined();
    });

    it("should return 400 for missing email", async () => {
      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      }, "10.0.0.4");

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("validation");
      expect(data.fieldErrors.email).toBeDefined();
    });
  });

  describe("Validation - Missing Vehicle Data", () => {
    it("should return 400 for missing vehicle year", async () => {
      const request = createMockRequest({
        service: "full-package",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      }, "10.0.0.5");

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("validation");
      expect(data.fieldErrors.year).toBeDefined();
    });

    it("should return 400 for missing vehicle make", async () => {
      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("validation");
      expect(data.fieldErrors.make).toBeDefined();
    });

    it("should return 400 for invalid year (out of range)", async () => {
      const request = createMockRequest({
        service: "full-package",
        year: "1800",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("validation");
      expect(data.fieldErrors.year).toBeDefined();
    });
  });

  describe("Database Failure Handling", () => {
    it("should return 500 when customer upsert fails", async () => {
      prismaMock.customer.upsert.mockRejectedValueOnce(new Error("Database connection lost"));

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Booking could not be saved. Please try again.");
      expect(logger.error).toHaveBeenCalled();
    });

    it("should return 500 when vehicle upsert fails", async () => {
      prismaMock.customer.upsert.mockResolvedValueOnce({ id: "cust-1" });
      prismaMock.vehicle.upsert.mockRejectedValueOnce(new Error("Unique constraint violation"));

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it("should return 500 when booking creation fails", async () => {
      prismaMock.customer.upsert.mockResolvedValueOnce({ id: "cust-1" });
      prismaMock.vehicle.upsert.mockResolvedValueOnce({ id: "veh-1" });
      prismaMock.booking.create.mockRejectedValueOnce(new Error("Booking insert failed"));

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        "booking",
        "db write failed",
        expect.any(Object)
      );
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within rate limit", async () => {
      const customerId = "cust-1";
      const vehicleId = "veh-1";
      const bookingId = "book-1";

      prismaMock.customer.upsert.mockResolvedValueOnce({ id: customerId });
      prismaMock.vehicle.upsert.mockResolvedValueOnce({ id: vehicleId });
      prismaMock.booking.create.mockResolvedValueOnce({ id: bookingId });

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
    });

    it("should return 429 when rate limit exceeded (memory store)", async () => {
      // Using in-memory rate limiter
      const customerId = "cust-1";
      const vehicleId = "veh-1";
      const bookingId = "book-1";

      prismaMock.customer.upsert.mockResolvedValue({ id: customerId });
      prismaMock.vehicle.upsert.mockResolvedValue({ id: vehicleId });
      prismaMock.booking.create.mockResolvedValue({ id: bookingId });

      const testIp = "192.168.1.100";
      const request = () =>
        createMockRequest(
          {
            service: "full-package",
            year: "2022",
            make: "Toyota",
            model: "Camry",
            color: "Silver",
            email: "john@example.com",
            name: "John Doe",
            phone: "555-1234",
            address: "123 Main St",
            city: "Denver",
            zip: "80202",
            date: "2024-12-25",
            timeWindow: "morning",
            notes: "",
          },
          testIp
        );

      // Make 5 successful requests (at limit)
      for (let i = 0; i < 5; i++) {
        const response = await POST(request());
        expect(response.status).toBe(200);
      }

      // 6th request should be rate limited
      const response = await POST(request());
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain("Too many booking attempts");
    });
  });

  describe("Email Failure Handling", () => {
    it("should still return 200 when email sending fails", async () => {
      const customerId = "cust-1";
      const vehicleId = "veh-1";
      const bookingId = "book-1";

      prismaMock.customer.upsert.mockResolvedValueOnce({ id: customerId });
      prismaMock.vehicle.upsert.mockResolvedValueOnce({ id: vehicleId });
      prismaMock.booking.create.mockResolvedValueOnce({ id: bookingId });
      vi.mocked(sendBookingEmail).mockRejectedValueOnce(new Error("SMTP connection failed"));

      const request = createMockRequest({
        service: "full-package",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        color: "Silver",
        email: "john@example.com",
        name: "John Doe",
        phone: "555-1234",
        address: "123 Main St",
        city: "Denver",
        zip: "80202",
        date: "2024-12-25",
        timeWindow: "morning",
        notes: "",
      });

      const response = await POST(request);

      // Email failure should not fail the booking
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(prismaMock.booking.create).toHaveBeenCalled();
    });
  });

  describe("Invalid Form Data", () => {
    it("should return 400 for invalid form data", async () => {
      const request = {
        formData: async () => {
          throw new Error("Corrupted form data");
        },
        headers: new Map([["x-forwarded-for", "192.168.1.1"]]),
      } as unknown as Request;

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid form data");
    });
  });
});
