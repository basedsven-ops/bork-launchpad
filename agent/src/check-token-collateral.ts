import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const FACTORY = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7";
const TOKEN = "0x04E81F904174C552Ee99D8C77Cc4291352Cc8adE";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY, [
    "function tokens(address) view returns (address creator, address collateralToken, uint256 targetCollateral, uint256 currentCollateral, uint256 memeSold, bool completed, uint256 totalMemeSupply, string tokenURI, uint256 virtualMemeReserve, uint256 virtualCollateralReserve)"
  ], provider);

  const tokenData = await factory.tokens(TOKEN);
  console.log("Token Collateral Data:");
  console.log(`- Collateral Token: ${tokenData.collateralToken}`);
  console.log(`- Creator: ${tokenData.creator}`);
  console.log(`- Completed: ${tokenData.completed}`);
  
  // Also get the symbol of the collateral token
  const erc20 = new ethers.Contract(tokenData.collateralToken, [
    "function symbol() view returns (string)"
  ], provider);
  const sym = await erc20.symbol().catch(() => "UNKNOWN");
  console.log(`- Collateral Symbol: ${sym}`);
}

main().catch(console.error);
