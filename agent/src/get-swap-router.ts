import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const POOL_ADDRESS = "0xA70fc67C9F69da90B63a0e4C05D229954574E313"; // CASHCAT V3 Pool

async function main() {
  console.log(`📡 Connecting to RPC: ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    // Swap(address,address,int256,int256,uint160,uint128,int24)
    const swapTopic = ethers.id("Swap(address,address,int256,int256,uint160,uint128,int24)");
    console.log("🔍 Fetching Swap logs for CASHCAT pool...");

    const logs = await provider.getLogs({
      address: POOL_ADDRESS,
      topics: [swapTopic],
      fromBlock: 0,
      toBlock: "latest"
    });

    console.log(`📊 Found ${logs.length} Swap events.`);

    const routers = new Set<string>();
    for (const log of logs) {
      // Uniswap V3 Swap event has sender in topic[1] (indexed)
      if (log.topics[1]) {
        const sender = ethers.getAddress("0x" + log.topics[1].slice(26));
        routers.add(sender);
      }
    }

    console.log("\n💎 Found Swap Router Addresses (contracts triggering swap on pool):");
    for (const router of routers) {
      const code = await provider.getCode(router);
      if (code !== "0x") {
        console.log(` 🟢 Router Address: ${router} (Code size: ${code.length - 2} bytes)`);
      } else {
        console.log(` ❌ EOA Address: ${router}`);
      }
    }

  } catch (error: any) {
    console.error("❌ Error running discovery:", error.message);
  }
}

main();
