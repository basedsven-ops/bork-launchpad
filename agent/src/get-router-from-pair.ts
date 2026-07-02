import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const PAIR_ADDRESS = "0xA70fc67C9F69da90B63a0e4C05D229954574E313";

async function main() {
  console.log(`📡 Connecting to RPC: ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    // Mint(address indexed sender, uint amount0, uint amount1)
    const mintTopic = ethers.id("Mint(address,uint256,uint256)");
    console.log("🔍 Fetching Mint logs for Uniswap V2 Pair...");

    const logs = await provider.getLogs({
      address: PAIR_ADDRESS,
      topics: [mintTopic],
      fromBlock: "earliest",
      toBlock: "latest"
    });

    console.log(`📊 Found ${logs.length} Mint events.`);

    const routers = new Set<string>();
    for (const log of logs) {
      if (log.topics[1]) {
        const sender = ethers.getAddress("0x" + log.topics[1].slice(26));
        routers.add(sender);
      }
    }

    console.log("\n🔍 Potential Uniswap V2 Router Addresses:");
    for (const router of routers) {
      const code = await provider.getCode(router);
      console.log(`🟢 Address: ${router} (Code size: ${code.length - 2} bytes)`);
    }

  } catch (error: any) {
    console.error("❌ Error running discovery:", error.message);
  }
}

main();
