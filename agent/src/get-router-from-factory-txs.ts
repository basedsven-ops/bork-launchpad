import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const FACTORY_ADDRESS = "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA";

async function main() {
  console.log(`📡 Connecting to RPC: ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    // PairCreated(address indexed token0, address indexed token1, address pair, uint)
    const pairCreatedTopic = ethers.id("PairCreated(address,address,address,uint256)");
    console.log("🔍 Fetching PairCreated logs for Uniswap V2 Factory...");

    const logs = await provider.getLogs({
      address: FACTORY_ADDRESS,
      topics: [pairCreatedTopic],
      fromBlock: 0,
      toBlock: "latest"
    });

    console.log(`📊 Found ${logs.length} PairCreated events.`);

    const routers = new Set<string>();
    for (const log of logs) {
      const txHash = log.transactionHash;
      const tx = await provider.getTransaction(txHash);
      if (tx && tx.to) {
        routers.add(ethers.getAddress(tx.to));
      }
    }

    console.log("\n💎 Found Router Addresses from Pair Creation Transactions:");
    for (const router of routers) {
      const code = await provider.getCode(router);
      console.log(`🟢 Router Address: ${router} (Code size: ${code.length - 2} bytes)`);
    }

  } catch (error: any) {
    console.error("❌ Error running discovery:", error.message);
  }
}

main();
