// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RWATokenFactory.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IRWATokenFactory {
    function buyToken(address tokenAddress, uint256 collateralAmount) external;
}

interface IZapperPoolManager {
    function unlock(bytes calldata data) external returns (bytes memory);
    function swap(
        PoolKey memory key,
        SwapParams memory params,
        bytes memory hookData
    ) external returns (int256 delta);
    function settle() external payable returns (uint256);
    function take(address currency, address to, uint256 amount) external;
}

contract BorkZapper {
    address public constant POOL_MANAGER = address(uint160(0x008366a39CC670B4001A1121B8F6A443a643e40951));
    address public constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;
    address public constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;
    
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;

    address public factory;

    constructor(address _factory) {
        factory = _factory;
    }

    receive() external payable {}

    // Struct to pass callback data
    struct UnlockData {
        address collateralToken;
        uint24 poolFee;
        int24 tickSpacing;
        uint256 ethAmount;
        address recipient;
        address memeToken;
    }

    // Swaps ETH to Collateral and buys the Meme Token in one transaction
    function zapBuy(
        address memeToken,
        address collateralToken,
        uint24 poolFee,
        int24 tickSpacing
    ) external payable {
        require(msg.value > 0, "No ETH sent");

        uint256 collateralReceived;

        if (collateralToken == WETH) {
            // Case 1: Collateral is WETH itself. Wrap ETH -> WETH and buy directly.
            IWETH(WETH).deposit{value: msg.value}();
            collateralReceived = msg.value;
            IERC20(WETH).approve(factory, collateralReceived);
            IRWATokenFactory(factory).buyToken(memeToken, collateralReceived);
        } else {
            // Case 2: Multi-hop swap ETH -> USDG -> collateralToken
            bytes memory unlockData = abi.encode(
                UnlockData({
                    collateralToken: collateralToken,
                    poolFee: poolFee,
                    tickSpacing: tickSpacing,
                    ethAmount: msg.value,
                    recipient: msg.sender,
                    memeToken: memeToken
                })
            );

            bytes memory result = IZapperPoolManager(POOL_MANAGER).unlock(unlockData);
            collateralReceived = abi.decode(result, (uint256));

            // Approve collateral to Factory and call buyToken
            IERC20(collateralToken).approve(factory, collateralReceived);
            IRWATokenFactory(factory).buyToken(memeToken, collateralReceived);
        }

        // Transfer purchased meme tokens back to the user
        uint256 memeBalance = IERC20(memeToken).balanceOf(address(this));
        require(IERC20(memeToken).transfer(msg.sender, memeBalance), "Meme transfer failed");
    }

    // Uniswap V4 PoolManager unlock callback
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == POOL_MANAGER, "Only PoolManager");

        UnlockData memory uData = abi.decode(data, (UnlockData));
        uint256 collateralReceived;

        if (uData.collateralToken == USDG) {
            // 1-hop swap: ETH -> USDG (fee 500, tickSpacing 10)
            PoolKey memory ethUsdgKey = PoolKey({
                currency0: address(0), // ETH is address(0)
                currency1: USDG,
                fee: 500,
                tickSpacing: 10,
                hooks: address(0)
            });

            int256 delta = IZapperPoolManager(POOL_MANAGER).swap(
                ethUsdgKey,
                SwapParams({
                    zeroForOne: true, // ETH is currency0
                    amountSpecified: -int256(uData.ethAmount),
                    sqrtPriceLimitX96: MIN_SQRT_RATIO + 1
                }),
                ""
            );

            // Extract amount1 (USDG received, positive)
            collateralReceived = uint256(uint128(int128(delta)));
        } else {
            // 2-hop swap: ETH -> USDG (fee 500, tickSpacing 10) then USDG -> collateralToken
            PoolKey memory ethUsdgKey = PoolKey({
                currency0: address(0),
                currency1: USDG,
                fee: 500,
                tickSpacing: 10,
                hooks: address(0)
            });

            int256 delta1 = IZapperPoolManager(POOL_MANAGER).swap(
                ethUsdgKey,
                SwapParams({
                    zeroForOne: true,
                    amountSpecified: -int256(uData.ethAmount),
                    sqrtPriceLimitX96: MIN_SQRT_RATIO + 1
                }),
                ""
            );

            // Extract amount1 (USDG received, positive)
            uint256 usdgAmount = uint256(uint128(int128(delta1)));

            bool usdgIsToken0 = USDG < uData.collateralToken;
            PoolKey memory usdgColKey = PoolKey({
                currency0: usdgIsToken0 ? USDG : uData.collateralToken,
                currency1: usdgIsToken0 ? uData.collateralToken : USDG,
                fee: uData.poolFee,
                tickSpacing: uData.tickSpacing,
                hooks: address(0)
            });

            int256 delta2 = IZapperPoolManager(POOL_MANAGER).swap(
                usdgColKey,
                SwapParams({
                    zeroForOne: usdgIsToken0,
                    amountSpecified: -int256(usdgAmount),
                    sqrtPriceLimitX96: usdgIsToken0 ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1
                }),
                ""
            );

            // Extract received collateral (positive)
            int256 colDelta = usdgIsToken0 ? int256(int128(delta2)) : int256(int128(delta2 >> 128));
            collateralReceived = uint256(colDelta);
        }

        // Settle native ETH debt using the payable settle() function
        IZapperPoolManager(POOL_MANAGER).settle{value: uData.ethAmount}();

        // Take Collateral (withdraw the swapped collateral token to this contract)
        IZapperPoolManager(POOL_MANAGER).take(uData.collateralToken, address(this), collateralReceived);

        return abi.encode(collateralReceived);
    }
}
