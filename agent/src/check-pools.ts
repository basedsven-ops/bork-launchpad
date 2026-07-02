import { ethers } from "ethers";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const POOL_MANAGER = ethers.getAddress("0x8366a39cc670b4001a1121b8f6a443a643e40951");
const WETH = ethers.getAddress("0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73");
const TSLA = ethers.getAddress("0x322F0929c4625eD5bAd873c95208D54E1c003b2d");

// Sort currencies
const currency0 = WETH.toLowerCase() < TSLA.toLowerCase() ? WETH : TSLA;
const currency1 = WETH.toLowerCase() < TSLA.toLowerCase() ? TSLA : WETH;

async function checkPool(fee: number, tickSpacing: number) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // V4 Pool ID calculation: keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks))
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const poolKeyStruct = [
    currency0,
    currency1,
    fee,
    tickSpacing,
    "0x0000000000000000000000000000000000000000" // hooks (address(0))
  ];
  
  const encoded = abiCoder.encode(
    ["address", "address", "uint24", "int24", "address"],
    poolKeyStruct
  );
  const poolId = ethers.keccak256(encoded);
  
  console.log(`Checking Pool ID for fee ${fee}: ${poolId}`);
  
  // Let's call poolManager.slots(poolId) or check state
  // In V4, slots(bytes32 poolId) returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint24 lpFee)
  const poolManagerContract = new ethers.Contract(
    POOL_MANAGER,
    ["function slots(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint24 lpFee)"],
    provider
  );
  
  try {
    const slots = await poolManagerContract.slots(poolId);
    console.log(`Result: sqrtPriceX96 = ${slots.sqrtPriceX96.toString()}, tick = ${slots.tick.toString()}`);
  } catch (err: any) {
    console.log(`Failed to fetch slots for fee ${fee}: ${err.message}`);
  }
}

async function main() {
  await checkPool(3000, 60);
  await checkPool(10000, 120);
  await checkPool(500, 10);
  await checkPool(100, 2);
}

main();
