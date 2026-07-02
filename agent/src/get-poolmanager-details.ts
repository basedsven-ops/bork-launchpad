import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ADDR_A = ethers.getAddress("0xC94135b63772b91D79d0A2DaAb2a8801f32359bD".toLowerCase());
const ADDR_B = ethers.getAddress("0x8366a39CC670B4001A1121B8F6A443a643e40951".toLowerCase());

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log(`Checking ADDR_A (${ADDR_A}) for PoolManager methods...`);
  try {
    const manager = new ethers.Contract(ADDR_A, [
      "function protocolFeeController() view returns (address)"
    ], provider);
    const controller = await manager.protocolFeeController();
    console.log(`  protocolFeeController: ${controller} -> SUCCESS (Indeed PoolManager!)`);
  } catch (err) {
    console.log(`  Failed PoolManager check for ADDR_A:`, err.message);
  }

  console.log(`Checking ADDR_B (${ADDR_B}) for PoolManager methods...`);
  try {
    const manager = new ethers.Contract(ADDR_B, [
      "function protocolFeeController() view returns (address)"
    ], provider);
    const controller = await manager.protocolFeeController();
    console.log(`  protocolFeeController: ${controller} -> SUCCESS (Indeed PoolManager!)`);
  } catch (err) {
    console.log(`  Failed PoolManager check for ADDR_B:`, err.message);
  }
}

main().catch(console.error);
