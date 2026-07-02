import { ethers } from "ethers";

async function main() {
  const sig = "Swap(address,address,int256,int256,uint160,uint128,int24)";
  console.log(`${sig} -> ${ethers.id(sig)}`);
}

main().catch(console.error);
