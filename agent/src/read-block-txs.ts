import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const BLOCK_NUMBER = 88836;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const block = await provider.getBlock(BLOCK_NUMBER, true);

  if (!block || !block.prefetchedTransactions) {
    console.log("Block not found or transactions not prefetched.");
    return;
  }

  console.log(`Block ${BLOCK_NUMBER} has ${block.prefetchedTransactions.length} transactions:`);
  for (const tx of block.prefetchedTransactions) {
    console.log(`\nTx Hash: ${tx.hash}`);
    console.log(`- From: ${tx.from}`);
    console.log(`- To: ${tx.to}`);
    console.log(`- Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`- Input (first 100 bytes): ${tx.data.slice(0, 202)}`);
    
    const receipt = await provider.getTransactionReceipt(tx.hash);
    if (receipt) {
      console.log(`- Contract Address Created: ${receipt.contractAddress}`);
      console.log(`- Logs count: ${receipt.logs.length}`);
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`  Log [${i}] Address: ${log.address}`);
        console.log(`  Log [${i}] Topics: ${JSON.stringify(log.topics)}`);
      }
    }
  }
}

main();
