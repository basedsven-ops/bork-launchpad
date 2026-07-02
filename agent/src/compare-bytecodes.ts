import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ADDR_A = ethers.getAddress("0xC94135b63772b91D79d0A2DaAb2a8801f32359bD".toLowerCase());
const ADDR_B = ethers.getAddress("0x8366a39CC670B4001A1121B8F6A443a643e40951".toLowerCase());

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const codeA = await provider.getCode(ADDR_A);
  const codeB = await provider.getCode(ADDR_B);

  console.log(`ADDR_A (${ADDR_A}) bytecode size: ${codeA.length / 2} bytes`);
  console.log(`ADDR_A starts with: ${codeA.slice(0, 100)}`);
  
  console.log(`ADDR_B (${ADDR_B}) bytecode size: ${codeB.length / 2} bytes`);
  console.log(`ADDR_B starts with: ${codeB.slice(0, 100)}`);
}

main().catch(console.error);
