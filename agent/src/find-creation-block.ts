import { ethers } from "ethers";

const RPC_URL = "https://poptye-always-win.poptyedev.com";
const TARGET_CONTRACT = "0xA70fc67C9F69da90B63a0e4C05D229954574E313"; // CASHCAT Pair

async function main() {
  console.log(`📡 Connecting to RPC: ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    const latestBlock = await provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);

    // Verify contract exists at latest block
    const codeLatest = await provider.getCode(TARGET_CONTRACT);
    if (codeLatest === "0x") {
      console.log("❌ Target contract is not deployed.");
      return;
    }

    console.log("🔍 Binary searching for the creation block of the target contract...");
    let low = 0;
    let high = latestBlock;
    let creationBlock = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const code = await provider.getCode(TARGET_CONTRACT, mid);
      if (code !== "0x") {
        creationBlock = mid;
        high = mid - 1; // Look for earlier blocks
      } else {
        low = mid + 1; // Contract not deployed yet
      }
    }

    if (creationBlock === -1) {
      console.log("❌ Could not find creation block.");
      return;
    }

    console.log(`🎯 Contract was deployed in block: ${creationBlock}`);

    // Get block details and its transactions
    const block = await provider.getBlock(creationBlock, true);
    if (!block || !block.prefetchedTransactions) {
      console.log("❌ Could not fetch block transactions.");
      return;
    }

    console.log(`📦 Found ${block.prefetchedTransactions.length} transactions in block ${creationBlock}:`);
    for (const tx of block.prefetchedTransactions) {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (!receipt) continue;

      // Check if it created the pair or interacted with factory
      // Pair created event topic: 0x0d3648bd0f6ba361f7db82a4204d33b81500b2310fe0fde2f90a001fcd9f4d22a74a
      const pairCreatedTopic = "0x0d3648bd0f6ba361f7db82a4204d33b81500b2310fe0fde2f90a001fcd9f4d22a74a";
      const hasPairCreated = receipt.logs.some(log => log.topics[0] === pairCreatedTopic);

      if (hasPairCreated) {
        console.log(`\n💎 MATCHING TRANSACTION: ${tx.hash}`);
        console.log(`   - Sent To (tx.to - Router/Factory): ${tx.to}`);
        console.log(`   - Sender (tx.from): ${tx.from}`);
        console.log(`   - Input: ${tx.data.slice(0, 138)}...`);
        return;
      }
    }

    console.log("❌ None of the transactions in the block emitted PairCreated.");
  } catch (error: any) {
    console.error("❌ Error running binary search:", error.message);
  }
}

main();
