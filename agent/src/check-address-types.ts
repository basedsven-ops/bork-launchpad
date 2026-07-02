import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ADDRESSES = [
  "0x2F4579Ca81717d3D61BF8b6f06571877Bbe54A07",
  "0xC94135b63772b91D79d0A2DaAb2a8801f32359bD",
  "0x1888DC199FeEe91cE077d03DC4D9c129902A4f3b",
  "0xB477751B76CF82d00a686A1232f5fCD772414Af3"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const addr of ADDRESSES) {
    console.log(`Checking ${addr}...`);
    try {
      const code = await provider.getCode(addr);
      if (code === "0x") {
        console.log("  Type: EOA (User Wallet)");
        continue;
      }
      
      // Try Uniswap V3 Pool interface
      const pool = new ethers.Contract(addr, [
        "function factory() view returns (address)",
        "function token0() view returns (address)",
        "function token1() view returns (address)",
        "function fee() view returns (uint24)"
      ], provider);

      const [token0, token1, fee] = await Promise.all([
        pool.token0().catch(() => null),
        pool.token1().catch(() => null),
        pool.fee().catch(() => null)
      ]);

      if (token0 && token1) {
        console.log(`  Type: Uniswap V3 Pool`);
        console.log(`  token0: ${token0}`);
        console.log(`  token1: ${token1}`);
        console.log(`  fee: ${fee}`);
      } else {
        console.log("  Type: Custom Contract");
      }
    } catch (err) {
      console.log("  Error checking:", err);
    }
  }
}

main().catch(console.error);
