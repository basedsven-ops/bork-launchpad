import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const FACTORY_ADDRESS = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7";

const FACTORY_ABI = [
  "function getAllTokens() external view returns (address[])",
  "function tokens(address) external view returns (address creator, address collateralToken, uint256 targetCollateral, uint256 currentCollateral, uint256 memeSold, bool completed, uint256 totalMemeSupply, string tokenURI, uint256 virtualMemeReserve, uint256 virtualCollateralReserve)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  
  try {
    const allTokens = await factory.getAllTokens();
    console.log(`Factory has ${allTokens.length} tokens launched:`);
    
    for (let i = 0; i < allTokens.length; i++) {
      const addr = allTokens[i];
      const info = await factory.tokens(addr);
      console.log(`\nToken ${i + 1}: ${addr}`);
      console.log(`- Creator: ${info.creator}`);
      console.log(`- Collateral Token: ${info.collateralToken}`);
      console.log(`- Current Collateral: ${ethers.formatUnits(info.currentCollateral, 18)}`);
      console.log(`- Target Collateral: ${ethers.formatUnits(info.targetCollateral, 18)}`);
      console.log(`- Meme Sold: ${ethers.formatUnits(info.memeSold, 18)}`);
      console.log(`- Completed: ${info.completed}`);
      console.log(`- Token URI: ${info.tokenURI}`);
    }
  } catch (err: any) {
    console.error("Error reading factory state:", err.message);
  }
}

main();
