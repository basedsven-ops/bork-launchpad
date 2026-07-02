import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const CASHCAT_ADDRESS = "0x020bfc650a365f8bb26819deaabf3e21291018b4";

async function main() {
  console.log(`📡 Connecting to Robinhood Chain Testnet RPC: ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    const code = await provider.getCode(CASHCAT_ADDRESS);
    if (code === "0x") {
      console.log("❌ CASHCAT token is not deployed on this network (Testnet). It might be on Mainnet.");
      return;
    }
    console.log("🟢 CASHCAT token contract found!");

    // Fetch logs for Transfer event
    // Transfer(address indexed from, address indexed to, uint256 value)
    const transferTopic = ethers.id("Transfer(address,address,uint256)");
    console.log("🔍 Fetching Transfer logs for CASHCAT...");
    
    const logs = await provider.getLogs({
      address: CASHCAT_ADDRESS,
      topics: [transferTopic],
      fromBlock: "earliest",
      toBlock: "latest"
    });

    console.log(`📊 Found ${logs.length} transfer events.`);
    
    // Find unique addresses that might be pools
    const addresses = new Set<string>();
    for (const log of logs) {
      // Topics: [eventSignature, from, to]
      if (log.topics[2]) {
        const to = ethers.getAddress("0x" + log.topics[2].slice(26));
        addresses.add(to);
      }
      if (log.topics[1]) {
        const from = ethers.getAddress("0x" + log.topics[1].slice(26));
        addresses.add(from);
      }
    }

    console.log(`🔍 Scanning ${addresses.size} unique addresses for Uniswap V2/V3 pool characteristics...`);
    for (const addr of addresses) {
      if (addr === ethers.ZeroAddress) continue;
      
      const addrCode = await provider.getCode(addr);
      if (addrCode === "0x") continue; // Skip EOAs

      // Try calling V2 Pair methods: factory()
      try {
        const contract = new ethers.Contract(addr, [
          "function factory() view returns (address)",
          "function token0() view returns (address)",
          "function token1() view returns (address)"
        ], provider);

        const factory = await contract.factory();
        const token0 = await contract.token0();
        const token1 = await contract.token1();

        console.log(`\n💎 FOUND UNISWAP V2 PAIR: ${addr}`);
        console.log(`   - Token0 : ${token0}`);
        console.log(`   - Token1 : ${token1}`);
        console.log(`   - Factory: ${factory}`);
        
        // Check standard Uniswap Router for this Factory
        // Commonly deployed routers or let's find the router that created this
        return; // Found it!
      } catch (e) {
        // Not a V2 pair
      }

      // Try V3 Pool methods: factory()
      try {
        const contract = new ethers.Contract(addr, [
          "function factory() view returns (address)",
          "function token0() view returns (address)",
          "function token1() view returns (address)",
          "function fee() view returns (uint24)"
        ], provider);

        const factory = await contract.factory();
        const token0 = await contract.token0();
        const token1 = await contract.token1();
        const fee = await contract.fee();

        console.log(`\n💎 FOUND UNISWAP V3 POIL: ${addr}`);
        console.log(`   - Token0 : ${token0}`);
        console.log(`   - Token1 : ${token1}`);
        console.log(`   - Fee    : ${fee}`);
        console.log(`   - Factory: ${factory}`);
        return;
      } catch (e) {
        // Not a V3 pool
      }
    }
    console.log("❌ No Uniswap pools found in token transfer logs.");
  } catch (error: any) {
    console.error("❌ Error running discovery:", error.message);
  }
}

main();
