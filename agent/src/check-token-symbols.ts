import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const TOKEN_A = ethers.getAddress("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168".toLowerCase());
const TOKEN_B = ethers.getAddress("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73".toLowerCase());

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  for (const [name, addr] of [["TOKEN_A", TOKEN_A], ["TOKEN_B", TOKEN_B]]) {
    console.log(`Checking ${name} (${addr})...`);
    try {
      const contract = new ethers.Contract(addr, [
        "function name() view returns (string)",
        "function symbol() view returns (string)"
      ], provider);
      const [nameVal, symbolVal] = await Promise.all([
        contract.name(),
        contract.symbol()
      ]);
      console.log(`  Name: ${nameVal} | Symbol: ${symbolVal}`);
    } catch (err) {
      console.log(`  Failed:`, err.message);
    }
  }
}

main().catch(console.error);
