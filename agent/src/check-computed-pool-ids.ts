import { ethers } from "ethers";

const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";
const LOG_POOL_2 = "0xdd5458c88d3de32b83514b9448bbfaa7f8df1d5f0a00939c95df4a5ceee53bf6";

function getPoolId(
  c0: string,
  c1: string,
  fee: number,
  tickSpacing: number,
  hooks: string
): string {
  const currency0 = c0.toLowerCase() < c1.toLowerCase() ? c0 : c1;
  const currency1 = c0.toLowerCase() < c1.toLowerCase() ? c1 : c0;
  
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const encoded = coder.encode(
    ["address", "address", "uint24", "int24", "address"],
    [currency0, currency1, fee, tickSpacing, hooks]
  );
  return ethers.keccak256(encoded);
}

// Brute force fee from 0 to 100,000, and tickSpacing from -1000 to 1000
const commonFees = [100, 500, 3000, 10000, 50000];
const commonTickSpacings = [2, 10, 60, 200, 500, 1000];

async function main() {
  console.log("Brute-forcing pool ID for LOG_POOL_2 (USDG/TSLA)...");
  
  // Try common ones first
  for (const fee of commonFees) {
    for (const ts of commonTickSpacings) {
      const id = getPoolId(USDG, TSLA, fee, ts, ethers.ZeroAddress);
      if (id === LOG_POOL_2) {
        console.log(`  MATCH FOUND: fee=${fee}, tickSpacing=${ts}`);
        return;
      }
    }
  }

  // If not found, try a wider range
  for (let fee = 0; fee <= 100000; fee += 100) {
    for (const ts of [1, 2, 5, 10, 20, 50, 60, 100, 200, 500, 1000]) {
      const id = getPoolId(USDG, TSLA, fee, ts, ethers.ZeroAddress);
      if (id === LOG_POOL_2) {
        console.log(`  MATCH FOUND: fee=${fee}, tickSpacing=${ts}`);
        return;
      }
    }
  }
  
  console.log("No match found.");
}

main().catch(console.error);
