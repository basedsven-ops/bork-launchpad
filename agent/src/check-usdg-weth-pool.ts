import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = ethers.getAddress("0x8366a39CC670B4001A1121B8F6A443a643e40951".toLowerCase());
const WETH = ethers.getAddress("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73".toLowerCase());
const USDG = ethers.getAddress("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168".toLowerCase());

const ABI = [
  "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(POOL_MANAGER, ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const startBlock = latestBlock - 100000;
  console.log(`Scanning WETH/USDG pools on PoolManager from block ${startBlock} to ${latestBlock}...`);

  try {
    const events = await contract.queryFilter(contract.filters.Initialize(), startBlock, latestBlock);
    for (const ev of events) {
      const c0 = ev.args[1].toLowerCase();
      const c1 = ev.args[2].toLowerCase();
      if ((c0 === WETH && c1 === USDG) || (c0 === USDG && c1 === WETH)) {
        console.log(`FOUND WETH/USDG pool:`);
        console.log(`- PoolId: ${ev.args[0]}`);
        console.log(`  fee: ${ev.args[3]}`);
        console.log(`  tickSpacing: ${ev.args[4]}`);
      }
    }
  } catch (err) {
    console.error("Error querying logs:", err.message);
  }
}

main().catch(console.error);
