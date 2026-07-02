import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = ethers.getAddress("0xC94135b63772b91D79d0A2DaAb2a8801f32359bD".toLowerCase());

// ABI with Initialize event
const ABI = [
  "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(POOL_MANAGER, ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const startBlock = latestBlock - 100000; // scan last 100k blocks to be safe and avoid range error
  console.log(`Querying initialized pools on canonical PoolManager (${POOL_MANAGER}) from block ${startBlock} to ${latestBlock}...`);
  
  try {
    const events = await contract.queryFilter(contract.filters.Initialize(), startBlock, latestBlock);
    console.log(`Found ${events.length} initialized pools:`);

    for (const ev of events) {
      const id = ev.args[0];
      const currency0 = ev.args[1];
      const currency1 = ev.args[2];
      const fee = ev.args[3];
      const tickSpacing = ev.args[4];
      const hooks = ev.args[5];
      console.log(`- PoolId: ${id}`);
      console.log(`  currency0: ${currency0}`);
      console.log(`  currency1: ${currency1}`);
      console.log(`  fee: ${fee}`);
      console.log(`  tickSpacing: ${tickSpacing}`);
      console.log(`  hooks: ${hooks}`);
    }
  } catch (err) {
    console.error("Error querying logs:", err.message);
  }
}

main().catch(console.error);
