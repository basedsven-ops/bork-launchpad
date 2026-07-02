import { ethers } from "ethers";

const FACTORY_ADDRESS = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7";
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";

const ABI = [
  "function getAllTokens() external view returns (address[])",
  "function tokens(address) external view returns (address creator, address collateralToken, uint256 targetCollateral, uint256 currentCollateral, uint256 memeSold, bool completed, uint256 totalMemeSupply, string tokenURI, uint256 virtualMemeReserve, uint256 virtualCollateralReserve)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, ABI, provider);
  
  console.log("Fetching all tokens...");
  const tokens = await factory.getAllTokens();
  console.log(`Found ${tokens.length} tokens:`);
  console.log(tokens);

  for (const token of tokens) {
    try {
      const info = await factory.tokens(token);
      console.log(`Token ${token}:`);
      console.log(`  Creator: ${info.creator}`);
      console.log(`  TokenURI: ${info.tokenURI}`);
    } catch (e: any) {
      console.error(`Error querying token ${token}:`, e.message);
    }
  }
}

main().catch(console.error);
