import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const POOLS = [
  "0xCaf681a66D020601342297493863E78C959E5cb2",
  "0x89e5DB8B5aA49aA85AC63f691524311AEB649eba"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const addr of POOLS) {
    console.log(`\nInspecting ${addr}:`);
    const contract = new ethers.Contract(addr, [
      "function token0() view returns (address)",
      "function token1() view returns (address)",
      "function fee() view returns (uint24)"
    ], provider);

    const t0 = await contract.token0().catch(() => null);
    const t1 = await contract.token1().catch(() => null);
    const fee = await contract.fee().catch(() => null);

    console.log(`  token0: ${t0}`);
    console.log(`  token1: ${t1}`);
    console.log(`  fee: ${fee}`);
  }
}

main().catch(console.error);
