import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ADDR_A = ethers.getAddress("0x2F4579Ca81717d3D61BF8b6f06571877Bbe54A07".toLowerCase());
const ADDR_B = ethers.getAddress("0xC94135b63772b91D79d0A2DaAb2a8801f32359bD".toLowerCase());

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const [name, addr] of [["ADDR_A", ADDR_A], ["ADDR_B", ADDR_B]]) {
    console.log(`\nInspecting ${name} (${addr}):`);
    const contract = new ethers.Contract(addr, [
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function fee() view returns (uint24)",
      "function factory() view returns (address)"
    ], provider);

    const token0 = await contract.token0().catch(e => `REVERT: ${e.message.slice(0, 80)}`);
    console.log(`  token0: ${token0}`);

    const token1 = await contract.token1().catch(e => `REVERT: ${e.message.slice(0, 80)}`);
    console.log(`  token1: ${token1}`);

    const fee = await contract.fee().catch(e => `REVERT: ${e.message.slice(0, 80)}`);
    console.log(`  fee: ${fee}`);

    const factory = await contract.factory().catch(e => `REVERT: ${e.message.slice(0, 80)}`);
    console.log(`  factory: ${factory}`);
  }
}

main().catch(console.error);
