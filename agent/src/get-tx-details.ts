import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const TX_HASH = "0xc06e0276d89c68c5aadad5232b1f0f9a744978aed1a3eaa119075fa20bcea08c";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log(`Fetching transaction details for ${TX_HASH}...`);
  const tx = await provider.getTransaction(TX_HASH);
  const receipt = await provider.getTransactionReceipt(TX_HASH);

  if (!tx || !receipt) {
    console.log("Transaction not found.");
    return;
  }

  console.log("Tx Info:");
  console.log(`- From: ${tx.from}`);
  console.log(`- To: ${tx.to}`);
  console.log(`- Value: ${ethers.formatEther(tx.value)} ETH`);
  
  console.log("\nReceipt Logs:");
  for (const log of receipt.logs) {
    console.log(`- Address: ${log.address}`);
    console.log(`  Topics: ${JSON.stringify(log.topics)}`);
    console.log(`  Data: ${log.data}`);
  }
}

main().catch(console.error);
