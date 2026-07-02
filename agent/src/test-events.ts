import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const FACTORY_ADDRESS = "0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7";
const TOKEN_ADDRESS = "0x04E81F904174C552Ee99D8C77Cc4291352Cc8adE";

const FACTORY_ABI = [
  "event TokenBought(address indexed tokenAddress, address indexed buyer, uint256 collateralAmount, uint256 memeAmount)",
  "event TokenSold(address indexed tokenAddress, address indexed buyer, uint256 memeAmount, uint256 collateralAmount)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  
  try {
    const filterBought = factory.filters.TokenBought(TOKEN_ADDRESS);
    const bought = await factory.queryFilter(filterBought, 0, "latest");
    console.log(`Query for TokenBought returned ${bought.length} events:`);
    for (let ev of bought) {
      console.log(`Transaction: ${ev.transactionHash}`);
      console.log(`- Block: ${ev.blockNumber}`);
      console.log(`- Buyer: ${ev.args?.[1]}`);
      console.log(`- Collateral: ${ethers.formatUnits(ev.args?.[2], 18)}`);
      console.log(`- Meme: ${ethers.formatUnits(ev.args?.[3], 18)}`);
    }
  } catch (err: any) {
    console.error("Error querying events:", err.message);
  }
}

main();
