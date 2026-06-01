import { serve } from "@hono/node-server";
import { connect } from "@kontor/db";
import { createApp } from "./app.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

serve({ fetch: createApp(connect(url)).fetch, port: Number(process.env.PORT ?? 3000) }, ({ port }) =>
  console.log(`api listening on port ${port}`),
);
