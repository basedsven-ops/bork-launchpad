import * as readline from "readline";
import { MessageParser } from "./parser";
import { BlockchainManager } from "./wallet";
import { TransactionHandler } from "./tx";
import * as dotenv from "dotenv";

dotenv.config();

const parser = new MessageParser();
const manager = new BlockchainManager();
const txHandler = new TransactionHandler(manager);

function printBanner() {
  console.clear();
  console.log("====================================================");
  console.log("🟢   RH-BANKR: AI SOCIAL TRADING ON ROBINHOOD L2   🟢");
  console.log("====================================================");
  console.log("Democratizing on-chain launchpad and trading via AI.");
  console.log("----------------------------------------------------\n");
  
  // Status check
  console.log(`🌐 Network RPC : ${process.env.RPC_URL}`);
  if (manager.wallet) {
    console.log(`🔑 Bot Address : ${manager.wallet.address}`);
  } else {
    console.log(`⚠️ Bot Address : READ-ONLY (no PRIVATE_KEY set)`);
  }
  
  const isFactoryConfigured = process.env.FACTORY_ADDRESS && process.env.FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000";
  const isDexConfigured = process.env.DEX_ADDRESS && process.env.DEX_ADDRESS !== "0x0000000000000000000000000000000000000000";

  console.log(`🏭 Factory     : ${isFactoryConfigured ? process.env.FACTORY_ADDRESS : "❌ NOT DEPLOYED"}`);
  console.log(`🏦 MockDEX     : ${isDexConfigured ? process.env.DEX_ADDRESS : "❌ NOT DEPLOYED"}`);
  console.log("\n----------------------------------------------------");

  if (!isFactoryConfigured || !isDexConfigured) {
    console.log("💡 Tip: Deploy mock contracts to testnet first using:");
    console.log("   npm run deploy\n");
  }

  console.log("Type 'help' to see sample commands or start typing your trading commands.");
  console.log("----------------------------------------------------\n");
}

function printHelp() {
  console.log("\n📖 Supported Commands Example:");
  console.log("  - Launch Token : 'launch token Robinhood Gold GOLD 0.1' or 'create GOLD'");
  console.log("  - Buy Token    : 'buy 0.05 GOLD' or 'swap 0.05 eth to gold'");
  console.log("  - Sell Token   : 'sell 100 GOLD' or 'sell gold 100'");
  console.log("  - Help         : 'help' or 'h'");
  console.log("  - Exit         : 'exit' or 'quit'\n");
}

async function main() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question("\n💬 You: ", async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log("👋 Goodbye!");
        process.exit(0);
      }

      if (trimmed === "") {
        promptUser();
        return;
      }

      console.log("🤖 Bankr is thinking...");
      
      try {
        const parsed = await parser.parse(trimmed);
        console.log("🎯 Action Parsed:", JSON.stringify(parsed, null, 2));

        switch (parsed.action) {
          case "help":
            printHelp();
            break;

          case "launch":
            if (!parsed.name || !parsed.symbol) {
              console.log("❌ Could not parse token name and symbol. Try: 'launch token Apple AAPL 0.1'");
            } else {
              const liquidity = parsed.ethLiquidity || "0.1";
              const result = await txHandler.launchToken(parsed.name, parsed.symbol, liquidity);
              console.log(`\n🎉 Success! Deployed ${parsed.name} ($${parsed.symbol})`);
              console.log(`📍 Token Address : ${result.tokenAddress}`);
              console.log(`🔗 Tx Hash       : ${result.txHash}`);
            }
            break;

          case "swap":
            if (!parsed.tokenSymbol || !parsed.amount || !parsed.direction) {
              console.log("❌ Missing swap details. Try: 'buy 0.1 GOLD' or 'sell 50 GOLD'");
            } else if (parsed.direction === "buy") {
              const result = await txHandler.buyToken(parsed.tokenSymbol, parsed.amount);
              console.log(`\n🎉 Buy Successful!`);
              console.log(`📈 New Balance   : ${result.balance} $${parsed.tokenSymbol.toUpperCase()}`);
              console.log(`🔗 Tx Hash       : ${result.txHash}`);
            } else {
              const result = await txHandler.sellToken(parsed.tokenSymbol, parsed.amount);
              console.log(`\n🎉 Sell Successful!`);
              console.log(`💰 New ETH Bal   : ${result.ethBalance} ETH`);
              console.log(`🔗 Tx Hash       : ${result.txHash}`);
            }
            break;

          case "unknown":
          default:
            console.log("❓ Sorry, I didn't get that. Try 'help' for examples.");
            break;
        }
      } catch (error: any) {
        console.log(`\n❌ Error executing transaction: ${error.message || error}`);
      }

      promptUser();
    });
  };

  promptUser();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
