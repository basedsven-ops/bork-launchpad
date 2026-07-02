import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const TARGET_CONTRACT = "0x8876789976decbfcbbbe364623c63652db8c0904"; // Universal Router

async function main() {
  console.log(`Connecting to RPC: ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    const latestBlock = await provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);

    let low = 0;
    let high = latestBlock;
    let creationBlock = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const code = await provider.getCode(TARGET_CONTRACT, mid);
      if (code !== "0x") {
        creationBlock = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (creationBlock === -1) {
      console.log("Could not find creation block.");
      return;
    }

    console.log(`Universal Router was deployed in block: ${creationBlock}`);

    const block = await provider.getBlock(creationBlock, true);
    if (!block) {
      console.log("Could not fetch block details.");
      return;
    }

    console.log(`Searching block transactions...`);
    for (const txHash of block.transactions) {
      const tx = typeof txHash === "string" ? await provider.getTransaction(txHash) : txHash;
      if (!tx) continue;
      
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (receipt && receipt.contractAddress && receipt.contractAddress.toLowerCase() === TARGET_CONTRACT.toLowerCase()) {
        console.log(`MATCHING TRANSACTION: ${tx.hash}`);
        console.log(`Input data: ${tx.data}`);
        return;
      }
    }
  } catch (error: any) {
    console.error("Error:", error);
  }
}

main();
