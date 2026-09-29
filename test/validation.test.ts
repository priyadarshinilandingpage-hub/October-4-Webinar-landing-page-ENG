import { describe, expect, it } from "vitest";
import { leadSchema } from "@/lib/validation";

const valid = {
  name: "Priya Raman",
  email: "Priya@Example.com ",
  phone: "98765 43210",
  consent: true,
  marketingConsent: false,
  website: "",
  elapsedMs: 12_000,
  utmSource: "facebook",
  utmCampaign: "oct4",
  utmContent: "creative_a",
};

const parse = (over: Record<string, unknown>) => leadSchema.safeParse({ ...valid, ...over });
const firstPath = (r: ReturnType<typeof parse>) => (r.success ? undefined : r.error.issues[0]?.path[0]);

describe("leadSchema", () => {
  it("accepts a valid lead and normalises it", () => {
    const r = parse({});
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.email).toBe("priya@example.com");
    expect(r.data.phone).toBe("9876543210");
    expect(r.data.consent).toBe(true);
  });

  it.each([
    ["+91 98765 43210", "9876543210"],
    ["+919876543210", "9876543210"],
    ["919876543210", "9876543210"],
    ["09876543210", "9876543210"],
    ["98765-43210", "9876543210"],
    ["(+91) 98765 43210", "9876543210"],
    ["0091 98765 43210", "9876543210"],
    ["6000000000", "6000000000"],
  ])("normalises phone %s → %s", (input, expected) => {
    const r = parse({ phone: input });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe(expected);
  });

  it.each(["12345", "5876543210", "98765432101", "+1 415 555 0100", "abcdefghij", ""])("rejects phone %s", (phone) => {
    expect(firstPath(parse({ phone }))).toBe("phone");
  });

  it.each(["not-an-email", "a@b", "priya@@example.com", "x".repeat(95) + "@example.com"])("rejects email %s", (email) => {
    expect(firstPath(parse({ email }))).toBe("email");
  });

  it("email is optional: empty, blank or missing becomes \"\"", () => {
    for (const email of ["", "   ", undefined]) {
      const r = parse({ email });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.email).toBe("");
    }
  });

  it("requires the registration consent box", () => {
    expect(firstPath(parse({ consent: false }))).toBe("consent");
    expect(firstPath(parse({ consent: "true" }))).toBe("consent");
  });

  it("keeps marketing consent optional and off by default", () => {
    const { marketingConsent: _omit, ...rest } = valid;
    const r = leadSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.marketingConsent).toBe(false);
  });

  it("parses the honeypot so the server (not the schema) can reject it quietly", () => {
    const r = parse({ website: "http://spam.example" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.website).toBe("http://spam.example");
  });

  it("rejects unknown keys, including a client-sent amount", () => {
    expect(parse({ amount: 1 }).success).toBe(false);
    expect(parse({ order_amount: "1.00" }).success).toBe(false);
    expect(parse({ currency: "USD" }).success).toBe(false);
    expect(parse({ return_url: "https://evil.example" }).success).toBe(false);
  });

  it("rejects names with digits or markup", () => {
    expect(firstPath(parse({ name: "<script>" }))).toBe("name");
    expect(firstPath(parse({ name: "R2D2" }))).toBe("name");
    expect(parse({ name: "  பிரியா   ரமணன் " }).success).toBe(true); // Tamil script is fine
  });

  it("rejects UTM values with odd characters", () => {
    expect(parse({ utmSource: "fb<script>" }).success).toBe(false);
  });

  it("requires elapsedMs to be a sane integer", () => {
    expect(parse({ elapsedMs: -1 }).success).toBe(false);
    expect(parse({ elapsedMs: "5000" }).success).toBe(false);
  });
});
