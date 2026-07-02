// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct SwapParams {
    bool zeroForOne;
    int256 amountSpecified;
    uint160 sqrtPriceLimitX96;
}

interface IPoolManager {
    function unlock(bytes calldata data) external returns (bytes memory);
    function swap(PoolKey calldata key, SwapParams calldata params, bytes calldata hookData) external returns (bytes memory);
}

contract TraceZapperTest is Test {
    address public constant POOL_MANAGER = address(uint160(0x008366a39CC670B4001A1121B8F6A443a643e40951));
    address public constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;

    uint160 internal constant MIN_SQRT_RATIO = 4295128739;

    function setUp() public {
        vm.createSelectFork("https://rpc.mainnet.chain.robinhood.com");
    }

    function testTraceSwap() public {
        vm.deal(address(this), 10 ether);
        
        console.log("Calling unlock...");
        IPoolManager(POOL_MANAGER).unlock("");
    }

    // Unlock callback implemented directly in the test contract
    function unlockCallback(bytes calldata) external returns (bytes memory) {
        console.log("Inside unlockCallback!");
        console.log("Caller:", msg.sender);

        PoolKey memory ethUsdgKey = PoolKey({
            currency0: address(0),
            currency1: USDG,
            fee: 500,
            tickSpacing: 10,
            hooks: address(0)
        });

        console.log("Executing first swap...");
        bytes memory result = IPoolManager(POOL_MANAGER).swap(
            ethUsdgKey,
            SwapParams({
                zeroForOne: true,
                amountSpecified: -1e15, // 0.001 ETH
                sqrtPriceLimitX96: MIN_SQRT_RATIO + 1
            }),
            ""
        );

        // Parse BalanceDelta
        // In Uniswap V4, swap returns BalanceDelta. Let's decode or parse it manually.
        int128 amount0;
        int128 amount1;
        assembly {
            amount0 := mload(add(result, 16))
            amount1 := mload(add(result, 32))
        }

        console.log("Swap returned delta:");
        console.log("  amount0 (raw):");
        console.logInt(amount0);
        console.log("  amount1 (raw):");
        console.logInt(amount1);

        return "";
    }
}
