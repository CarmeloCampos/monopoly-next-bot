import { env } from "../src/config";

const { CRON_SECRET } = env;
const BASE_URL = env.NOWPAYMENTS_IPN_URL;

if (!CRON_SECRET) {
  console.error("CRON_SECRET environment variable is required");
  process.exit(1);
}

if (!BASE_URL) {
  console.error("NOWPAYMENTS_IPN_URL environment variable is required");
  process.exit(1);
}

async function triggerEndpoint(path: string): Promise<void> {
  const url = `${BASE_URL}${path}`;
  console.log(`Triggering ${url}...`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    if (response.ok) {
      const data = await response.text();
      console.log(`✓ ${path} - Success:`, data || "OK");
    } else {
      console.error(
        `✗ ${path} - Failed:`,
        response.status,
        await response.text(),
      );
    }
  } catch (err) {
    console.error(
      `✗ ${path} - Error:`,
      err instanceof Error ? err.message : err,
    );
  }
}

async function main(): Promise<void> {
  console.log("Starting cron trigger...");
  console.log("Base URL:", BASE_URL);
  console.log("---");

  await triggerEndpoint("/generate-earnings");
  await triggerEndpoint("/send-rent-reminders");
  await triggerEndpoint("/check-payment-statuses");

  console.log("---");
  console.log("Cron trigger completed");
}

main();
