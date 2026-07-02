import { BlockchainManager } from "./wallet";
import { TransactionHandler } from "./tx";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Testing Token Launch on Robinhood Chain Testnet...");
  
  const manager = new BlockchainManager();
  const txHandler = new TransactionHandler(manager);

  try {
    const name = "TestnetBankr";
    const symbol = "TBNK";
    const liquidityEth = "0.001"; // small amount to fit within faucet limits

    console.log(`📡 Launching token ${name} ($${symbol}) with ${liquidityEth} ETH liquidity...`);
    const result = await txHandler.launchToken(name, symbol, liquidityEth);
    
    console.log("\n🎉 TESTNET LAUNCH SUCCESSFUL!");
    console.log(`📍 Token Address : ${result.tokenAddress}`);
    console.log(`🔗 Transaction   : ${result.txHash}`);
    console.log(`💳 Deployer      : ${manager.wallet.address}`);
    
    const balance = await manager.provider.getBalance(manager.wallet.address);
    console.log(`💰 Remaining Bal: ${manager.ethers.formatEther(balance)} ETH`);

  } catch (error: any) {
    console.error("\n❌ Launch failed:", error.message);
  }
}

main();
