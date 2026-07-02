import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ROUTER = ethers.getAddress("0x4262efBd176F02824af27010bEa218429c33c7E8".toLowerCase());
const POOL = ethers.getAddress("0xC94135b63772b91D79d0A2DaAb2a8801f32359bD".toLowerCase());

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log(`Checking ROUTER (${ROUTER})...`);
  try {
    const contract = new ethers.Contract(ROUTER, [
      "function factory() view returns (address)",
      "function poolManager() view returns (address)"
    ], provider);
    const [fac, pm] = await Promise.all([
      contract.factory().catch(() => null),
      contract.poolManager().catch(() => null)
    ]);
    console.log(`  factory: ${fac}`);
    console.log(`  poolManager: ${pm}`);
  } catch (err) {
    console.log(`  Failed:`, err.message);
  }

  console.log(`Checking POOL (${POOL})...`);
  try {
    const contract = new ethers.Contract(POOL, [
      "function factory() view returns (address)",
      "function token0() view returns (address)",
      "function token1() view returns (address)"
    ], provider);
    const [fac, t0, t1] = await Promise.all([
      contract.factory().catch(() => null),
      contract.token0().catch(() => null),
      contract.token1().catch(() => null)
    ]);
    console.log(`  factory: ${fac}`);
    console.log(`  token0: ${t0}`);
    console.log(`  token1: ${t1}`);
  } catch (err) {
    console.log(`  Failed:`, err.message);
  }
}

main().catch(console.error);
