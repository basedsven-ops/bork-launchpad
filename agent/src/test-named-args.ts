import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const FACTORY_ADDRESS = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7";
const TOKEN_ADDRESS = "0x04E81F904174C552Ee99D8C77Cc4291352Cc8adE";

const FACTORY_ABI = [
  "event TokenBought(address indexed tokenAddress, address indexed buyer, uint256 collateralAmount, uint256 memeAmount)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  
  try {
    const filterBought = factory.filters.TokenBought(TOKEN_ADDRESS);
    const bought = await factory.queryFilter(filterBought, 0, "latest");
    console.log(`Bought logs: ${bought.length}`);
    if (bought.length > 0) {
      const log = bought[0];
      console.log("args keys:", Object.keys(log.args || {}));
      console.log("args.collateralAmount:", log.args.collateralAmount);
      console.log("args.buyer:", log.args.buyer);
      console.log("args.memeAmount:", log.args.memeAmount);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main();
