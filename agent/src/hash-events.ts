import { ethers } from "ethers";

const TARGET_HASH = "0x9a989e5e46c6033afc8355005be1837c4f1d05a2a79acb3d63f7d371d74698f7";

const signatures = [
  "Swap(bytes32,address,int256,int256,uint160,uint128,int24,uint24)",
  "Swap(bytes32,address,address,int256,int256,uint160,uint128,int24)",
  "Swap(bytes32,address,int256,int256,uint160,uint128,int24)",
  "Swap(bytes32,address,address,int256,int256,uint160,uint128,int24,uint24)",
  "Swap(address,address,int256,int256,uint160,uint128,int24)",
  "Swap(address,int256,int256,uint160,uint128,int24)",
  "Swap(bytes32,address,int256,int256,uint160,uint128,int24,uint16)",
  // V4 events
  "Swap(bytes32,address,int256,int256,uint160,uint128,int24)",
  "Swap(bytes32,address,address,int256,int256,uint160,uint128,int24)",
  "Swap(bytes32,address,int256,int256,uint160,uint128,int24,uint24)"
];

function main() {
  for (const sig of signatures) {
    const hash = ethers.id(sig);
    if (hash === TARGET_HASH) {
      console.log(`MATCH FOUND: ${sig}`);
      return;
    }
  }
  console.log("No match found in current list.");
}

main();
