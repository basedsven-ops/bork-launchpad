import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const TSLA_ADDRESS = ethers.getAddress("0x322F0929c4625eD5bAd873c95208D54E1c003b2d".toLowerCase());

const ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(TSLA_ADDRESS, ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const startBlock = latestBlock - 50000;
  console.log(`Querying Transfer events for TSLA from block ${startBlock} to ${latestBlock}...`);
  try {
    const events = await contract.queryFilter(contract.filters.Transfer(), startBlock, latestBlock);
    console.log(`Found ${events.length} transfer events:`);
    
    const addressCounts: Record<string, number> = {};
    for (const ev of events) {
      const from = ev.args[0];
      const to = ev.args[1];
      const val = ethers.formatUnits(ev.args[2], 18);
      
      addressCounts[from] = (addressCounts[from] || 0) + 1;
      addressCounts[to] = (addressCounts[to] || 0) + 1;
      
      console.log(`- From: ${from} | To: ${to} | Val: ${val} | Tx: ${ev.transactionHash}`);
    }

    console.log("\nUnique addresses involved and transaction counts:");
    console.log(addressCounts);
  } catch (err) {
    console.error("Error querying Transfer events:", err);
  }
}

main().catch(console.error);
