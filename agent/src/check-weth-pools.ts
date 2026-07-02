import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const WETH = ethers.getAddress("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73".toLowerCase());

const ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(WETH, ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const startBlock = latestBlock - 500;
  console.log(`Querying Transfer events for WETH from block ${startBlock} to ${latestBlock}...`);
  try {
    const events = await contract.queryFilter(contract.filters.Transfer(), startBlock, latestBlock);
    console.log(`Found ${events.length} WETH transfers:`);
    
    const dests: Record<string, number> = {};
    for (const ev of events) {
      const to = ev.args[1];
      dests[to] = (dests[to] || 0) + 1;
    }
    console.log("Destinations and transaction counts:");
    console.log(dests);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main().catch(console.error);
