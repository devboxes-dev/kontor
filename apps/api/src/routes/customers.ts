import { zValidator } from "@hono/zod-validator";
import { type Database, customers } from "@kontor/db";
import { Hono } from "hono";
import { z } from "zod";

const customerInput = z.object({
  name: z.string().min(1),
  email: z.email(),
  street: z.string().min(1),
  postalCode: z.string().regex(/^\d{4,5}$/),
  city: z.string().min(1),
  country: z.enum(["DE", "AT"]),
  locale: z.enum(["de", "en"]).default("de"),
});

export function customerRoutes(db: Database) {
  return new Hono()
    .get("/", async (c) => c.json(await db.select().from(customers).orderBy(customers.name)))
    .post("/", zValidator("json", customerInput), async (c) => {
      const [customer] = await db.insert(customers).values(c.req.valid("json")).returning();
      return c.json(customer!, 201);
    });
}
