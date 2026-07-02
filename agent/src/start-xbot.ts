import { XBot } from "./xbot";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.clear();
  console.log("====================================================");
  console.log("🐦  RH-BANKR X BOT — ROBINHOOD CHAIN L2            ");
  console.log("====================================================");
  console.log("Deploy tokens & trade via X/Twitter mentions.\n");

  const requiredVars = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"];
  const missing = requiredVars.filter(v => !process.env[v] || process.env[v]!.includes("your_"));

  if (missing.length > 0) {
    console.error("❌ Missing X API credentials in .env:");
    missing.forEach(v => console.error(`   - ${v}`));
    console.error("\n💡 Get your keys at: https://developer.x.com/en/portal/dashboard");
    console.error("   Then add them to agent/.env");
    process.exit(1);
  }

  const bot = new XBot();
  await bot.start();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
