import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const CONTENT_PATH = "/Users/bob/.gemini/antigravity/brain/4c9af6e4-591a-4b0b-8b72-02a74bb30faf/.system_generated/steps/696/content.md";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Read content.md and parse the JSON (skip header lines)
  const rawContent = fs.readFileSync(CONTENT_PATH, "utf8");
  const jsonStartIndex = rawContent.indexOf("[");
  if (jsonStartIndex === -1) {
    console.error("❌ Could not find JSON start in content.md");
    process.exit(1);
  }
  const jsonStr = rawContent.slice(jsonStartIndex);
  const items = JSON.parse(jsonStr);

  console.log(`📊 Found ${items.length} folders in GitHub assets.`);
  console.log("🔍 Querying each contract on Poptye L2 RPC...");

  const results: any[] = [];

  for (const item of items) {
    const address = item.name; // directory name is the token address
    if (!address.startsWith("0x") || address.length !== 42) continue;

    try {
      const contract = new ethers.Contract(address, ERC20_ABI, provider);
      // Run promises in parallel with timeout to avoid hanging
      const namePromise = contract.name();
      const symbolPromise = contract.symbol();
      const supplyPromise = contract.totalSupply();

      const [name, symbol, supply] = await Promise.all([namePromise, symbolPromise, supplyPromise]);
      
      console.log(` 🟢 Found: $${symbol} - ${name} (${address}) - Supply: ${ethers.formatEther(supply)}`);
      results.push({ symbol, name, address, supply: ethers.formatEther(supply) });
    } catch (e) {
      // Not deployed on this network or not a standard ERC-20
    }
  }

  console.log(`\n✅ Query finished. Found ${results.length} active tokens on-chain:`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
