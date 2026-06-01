import { zValidator } from "@hono/zod-validator";
import { type Database, customers } from "@kontor/db";
import { Hono } from "hono";
import { z } from "zod";

const customerInput = z.object({
  name: z.string().min(1),
  email: z.email(),
  street: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.enum(["DE", "AT"]),
});

export function customerRoutes(db: Database) {
  return new Hono()
    .get("/", async (c) => c.json(await db.select().from(customers).orderBy(customers.name)))
    .post("/", zValidator("json", customerInput), async (c) => {
      const [customer] = await db.insert(customers).values(c.req.valid("json")).returning();
      return c.json(customer!, 201);
    });
}
