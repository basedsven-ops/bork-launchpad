import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ADDR = ethers.getAddress("0x8876789976dEcBfCbBbe364623C63652db8C0904".toLowerCase());

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log(`Inspecting ${ADDR} for Uniswap V3 pool getters...`);

  const contract = new ethers.Contract(ADDR, [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function fee() view returns (uint24)"
  ], provider);

  try {
    const t0 = await contract.token0();
    const t1 = await contract.token1();
    const fee = await contract.fee();
    console.log(`SUCCESS!`);
    console.log(`- token0: ${t0}`);
    console.log(`- token1: ${t1}`);
    console.log(`- fee: ${fee}`);
  } catch (err) {
    console.log(`Failed: ${err.message}`);
  }
}

main().catch(console.error);
