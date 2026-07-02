// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/mock/CustomRWAToken.sol";

interface IWETH {
    function deposit() external payable;
    function approve(address spender, uint256 amount) external returns (bool);
}

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

interface IPoolManager {
    function initialize(PoolKey memory key, uint160 sqrtPriceX96) external returns (int24 tick);
}

interface IPositionManager {
    function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable;
}

interface IPermit2 {
    function approve(address token, address spender, uint160 amount, uint48 expiration) external;
}

contract DeployCustomRWA is Script {
    address public constant POOL_MANAGER = address(uint160(0x008366a39CC670B4001A1121B8F6A443a643e40951));
    address public constant POSITION_MANAGER = 0x58daec3116aae6D93017bAAea7749052E8a04fA7;
    address public constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address public constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Custom TSLA
        CustomRWAToken tsla = new CustomRWAToken("Tesla Inc. Tokenized Stock", "TSLA", 1_000_000 * 10**18);
        console.log("Custom TSLA deployed at:", address(tsla));

        // 2. Wrap 0.0002 ETH to WETH
        uint256 wrapAmount = 0.0002 * 10**18;
        IWETH(WETH).deposit{value: wrapAmount}();
        console.log("Wrapped 0.0002 ETH to WETH");

        // 3. Set up sorting for PoolKey
        address currency0 = address(tsla) < WETH ? address(tsla) : WETH;
        address currency1 = address(tsla) < WETH ? WETH : address(tsla);
        
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 3000,
            tickSpacing: 60,
            hooks: address(0)
        });

        // 1:1 price initial ratio -> sqrtPriceX96 = 79228162514264337593543950336
        uint160 sqrtPriceX96 = 79228162514264337593543950336;
        
        // 4. Initialize Pool
        IPoolManager(POOL_MANAGER).initialize(key, sqrtPriceX96);
        console.log("Uniswap V4 pool initialized");

        // 5. Approvals for Permit2
        CustomRWAToken(tsla).approve(PERMIT2, type(uint256).max);
        IWETH(WETH).approve(PERMIT2, type(uint256).max);

        // 6. Approvals from Permit2 to PositionManager
        IPermit2(PERMIT2).approve(address(tsla), POSITION_MANAGER, type(uint160).max, type(uint48).max);
        IPermit2(PERMIT2).approve(WETH, POSITION_MANAGER, type(uint160).max, type(uint48).max);
        console.log("Approvals configured");

        // 7. Add liquidity (0.0002 WETH + 0.0002 TSLA)
        uint128 liquidity = uint128(0.0002 * 10**18);
        
        bytes memory actions = abi.encodePacked(uint8(2), uint8(13)); // MINT_POSITION, SETTLE_PAIR
        bytes[] memory params = new bytes[](2);
        
        params[0] = abi.encode(
            key,
            int24(-887220), // tickLower (full range)
            int24(887220),  // tickUpper
            uint256(liquidity),
            wrapAmount,     // amount0Max
            wrapAmount,     // amount1Max
            deployer,       // recipient
            ""              // hookData
        );
        params[1] = abi.encode(currency0, currency1);

        IPositionManager(POSITION_MANAGER).modifyLiquidities(abi.encode(actions, params), block.timestamp);
        console.log("Liquidity added to Uniswap V4 pool successfully!");

        vm.stopBroadcast();
    }
}
