import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = ethers.getAddress("0x8366a39CC670B4001A1121B8F6A443a643e40951".toLowerCase());

const ABI = [
  "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(POOL_MANAGER, ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const startBlock = latestBlock - 20000;
  console.log(`Querying initialized pools on Uniswap V4 from block ${startBlock} to ${latestBlock}...`);
  try {
    const events = await contract.queryFilter(contract.filters.Initialize(), startBlock, latestBlock);
    console.log(`Found ${events.length} initialized pools in the last 20k blocks:`);
    for (const ev of events) {
      console.log(`- PoolId: ${ev.args[0]}`);
      console.log(`  currency0: ${ev.args[1]}`);
      console.log(`  currency1: ${ev.args[2]}`);
      console.log(`  fee: ${ev.args[3]}`);
    }
  } catch (err) {
    console.error("Error querying logs:", err);
  }
}

main().catch(console.error);
