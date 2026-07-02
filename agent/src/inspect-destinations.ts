import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const ADDRESSES = [
  "0xCaf681a66D020601342297493863E78C959E5cb2",
  "0x89e5DB8B5aA49aA85AC63f691524311AEB649eba",
  "0x8876789976dEcBfCbBbe364623C63652db8C0904"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const addr of ADDRESSES) {
    console.log(`\nInspecting ${addr}:`);
    try {
      const code = await provider.getCode(addr);
      console.log(`  Bytecode size: ${code.length / 2} bytes`);
      
      const erc20 = new ethers.Contract(addr, [
        "function name() view returns (string)",
        "function symbol() view returns (string)"
      ], provider);
      
      const name = await erc20.name().catch(() => null);
      const symbol = await erc20.symbol().catch(() => null);
      console.log(`  ERC20 Name: ${name} | Symbol: ${symbol}`);
    } catch (err) {
      console.log("  Failed:", err.message);
    }
  }
}

main().catch(console.error);
