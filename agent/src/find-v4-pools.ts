import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = ethers.getAddress("0xC94135b63772b91D79d0A2DaAb2a8801f32359bD".toLowerCase());
const WETH = ethers.getAddress("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73".toLowerCase());
const USDG = ethers.getAddress("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168".toLowerCase());
const TSLA = ethers.getAddress("0x322F0929c4625eD5bAd873c95208D54E1c003b2d".toLowerCase());

// ABI for getSlot0
const ABI = [
  "function getSlot0(bytes32 id) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)"
];

// Helper to compute PoolId
function getPoolId(
  currency0: string,
  currency1: string,
  fee: number,
  tickSpacing: number,
  hooks: string
): string {
  const c0 = currency0.toLowerCase() < currency1.toLowerCase() ? currency0 : currency1;
  const c1 = currency0.toLowerCase() < currency1.toLowerCase() ? currency1 : currency0;
  
  const encoded = ethers.solidityPacked(
    ["address", "address", "uint24", "int24", "address"],
    [c0, c1, fee, tickSpacing, hooks]
  );
  return ethers.keccak256(encoded);
}

const feeTiers = [
  { fee: 3000, tickSpacing: 60 },
  { fee: 500, tickSpacing: 10 },
  { fee: 10000, tickSpacing: 200 },
  { fee: 100, tickSpacing: 2 }
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(POOL_MANAGER, ABI, provider);

  console.log(`Checking WETH/USDG pools on canonical PoolManager (${POOL_MANAGER})...`);
  for (const tier of feeTiers) {
    const id = getPoolId(WETH, USDG, tier.fee, tier.tickSpacing, ethers.ZeroAddress);
    try {
      const [sqrtPrice] = await contract.getSlot0(id);
      console.log(`  Querying fee=${tier.fee}, tickSpacing=${tier.tickSpacing}, sqrtPrice=${sqrtPrice}`);
      if (sqrtPrice > 0n) {
        console.log(`  FOUND WETH/USDG Pool: fee=${tier.fee}, tickSpacing=${tier.tickSpacing}, id=${id}`);
      }
    } catch (e) {
      console.log(`  Error fee=${tier.fee}:`, e.message);
    }
  }

  console.log("\nChecking USDG/TSLA pools...");
  for (const tier of feeTiers) {
    const id = getPoolId(USDG, TSLA, tier.fee, tier.tickSpacing, ethers.ZeroAddress);
    try {
      const [sqrtPrice] = await contract.getSlot0(id);
      console.log(`  Querying fee=${tier.fee}, tickSpacing=${tier.tickSpacing}, sqrtPrice=${sqrtPrice}`);
      if (sqrtPrice > 0n) {
        console.log(`  FOUND USDG/TSLA Pool: fee=${tier.fee}, tickSpacing=${tier.tickSpacing}, id=${id}`);
      }
    } catch (e) {
      console.log(`  Error fee=${tier.fee}:`, e.message);
    }
  }

  console.log("\nChecking WETH/TSLA pools...");
  for (const tier of feeTiers) {
    const id = getPoolId(WETH, TSLA, tier.fee, tier.tickSpacing, ethers.ZeroAddress);
    try {
      const [sqrtPrice] = await contract.getSlot0(id);
      console.log(`  Querying fee=${tier.fee}, tickSpacing=${tier.tickSpacing}, sqrtPrice=${sqrtPrice}`);
      if (sqrtPrice > 0n) {
        console.log(`  FOUND WETH/TSLA Pool: fee=${tier.fee}, tickSpacing=${tier.tickSpacing}, id=${id}`);
      }
    } catch (e) {
      console.log(`  Error fee=${tier.fee}:`, e.message);
    }
  }
}

main().catch(console.error);
