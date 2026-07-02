import { ethers } from "ethers";

const MAINNET_RPC = "https://poptye-always-win.poptyedev.com";

const UNISWAP_ADDRESSES: Record<string, string> = {
  "Uniswap V3 Factory": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  "Uniswap V3 SwapRouter02": "0x3bFA4769FB09e2C5a62B41d85b1EFA08c1482E2a",
  "Uniswap V3 NonfungiblePositionManager": "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  "Uniswap V2 Factory": "0x5C69bEE701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  "Uniswap V2 Router": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "WETH": "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" // Dari metadata Trust Wallet
};

async function main() {
  console.log(`📡 Connecting to Robinhood Chain Mainnet RPC: ${MAINNET_RPC}...`);
  const provider = new ethers.JsonRpcProvider(MAINNET_RPC);

  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected! Latest Block: ${blockNumber}`);
    
    console.log("\n🔍 Checking Uniswap Contract deployments on Robinhood Mainnet:");
    for (const [name, address] of Object.entries(UNISWAP_ADDRESSES)) {
      try {
        const checksummed = ethers.getAddress(address.toLowerCase());
        const code = await provider.getCode(checksummed);
        if (code !== "0x") {
          console.log(`🟢 ${name} is DEPLOYED at ${checksummed} (Code size: ${code.length - 2} bytes)`);
        } else {
          console.log(`❌ ${name} is NOT deployed at ${checksummed}`);
        }
      } catch (err: any) {
        console.log(`❌ Error checking ${name}: ${err.message}`);
      }
    }
  } catch (e: any) {
    console.error("❌ Failed to query mainnet RPC:", e.message);
  }
}

main();
