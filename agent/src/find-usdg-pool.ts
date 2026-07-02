import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const STATE_VIEW = "0xf3334192d15450cdd385c8b70e03f9a6bd9e673b";
const USDG = ethers.getAddress("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168");
const TSLA = ethers.getAddress("0x322F0929c4625eD5bAd873c95208D54E1c003b2d");

const currency0 = USDG.toLowerCase() < TSLA.toLowerCase() ? USDG : TSLA;
const currency1 = USDG.toLowerCase() < TSLA.toLowerCase() ? TSLA : USDG;

async function checkPool(fee: number, tickSpacing: number) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const poolKeyStruct = [
    currency0,
    currency1,
    fee,
    tickSpacing,
    "0x0000000000000000000000000000000000000000" // hooks
  ];
  
  const encoded = abiCoder.encode(
    ["address", "address", "uint24", "int24", "address"],
    poolKeyStruct
  );
  const poolId = ethers.keccak256(encoded);
  
  const stateViewContract = new ethers.Contract(
    STATE_VIEW,
    ["function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint24 lpFee)"],
    provider
  );
  
  try {
    const slots = await stateViewContract.getSlot0(poolId);
    console.log(`USDG/TSLA Fee ${fee} (spacing ${tickSpacing}): sqrtPriceX96 = ${slots.sqrtPriceX96.toString()}, tick = ${slots.tick.toString()}`);
  } catch (err: any) {
    console.log(`Fee ${fee} failed: ${err.message}`);
  }
}

async function main() {
  const tiers = [
    { fee: 3000, spacing: 60 },
    { fee: 10000, spacing: 120 },
    { fee: 500, spacing: 10 },
    { fee: 100, spacing: 2 },
    { fee: 3000, spacing: 10 },
    { fee: 500, spacing: 60 },
    { fee: 100, spacing: 10 }
  ];
  
  for (const tier of tiers) {
    await checkPool(tier.fee, tier.spacing);
  }
}

main();
