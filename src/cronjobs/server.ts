import { generateEarningsForAllUsers } from "./generate-earnings";
import { info, error } from "@/utils/logger";

const CRON_SECRET = process.env["CRON_SECRET"] || "default-secret";
const CRON_PORT = Number.parseInt(process.env["CRON_PORT"] || "3001", 10);

Bun.serve({
  port: CRON_PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/generate-earnings") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        error("Unauthorized cron job request", {
          authHeaderReceived: authHeader ? "exists" : "none",
        });
        return new Response("Unauthorized", { status: 401 });
      }

      generateEarningsForAllUsers()
        .then(() => info("Earnings generated successfully"))
        .catch((err) => error("Error generating earnings", { error: err }));

      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

info("Cron server started", { port: CRON_PORT });
