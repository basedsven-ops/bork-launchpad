// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RWATokenFactory.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
}

interface IRWATokenFactory {
    function buyToken(address tokenAddress, uint256 collateralAmount) external;
}

contract BorkZapper {
    address public constant POOL_MANAGER = 0x8366a39CC670B4001A1121B8F6A443A643e40951;
    address public constant WETH = 0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73;
    
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;

    address public factory;

    constructor(address _factory) {
        factory = _factory;
    }

    receive() external payable {}

    // Struct to pass callback data
    struct UnlockData {
        PoolKey poolKey;
        uint256 wethAmount;
        address collateralToken;
        address memeToken;
        address recipient;
    }

    // Swaps ETH to Collateral and buys the Meme Token in one transaction
    function zapBuy(
        address memeToken,
        address collateralToken,
        uint24 poolFee,
        int24 tickSpacing
    ) external payable {
        require(msg.value > 0, "No ETH sent");

        // 1. Wrap native ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();

        // 2. Set up PoolKey for Uniswap V4 swap
        bool wethIsToken0 = WETH < collateralToken;
        PoolKey memory poolKey = PoolKey({
            currency0: wethIsToken0 ? WETH : collateralToken,
            currency1: wethIsToken0 ? collateralToken : WETH,
            fee: poolFee,
            tickSpacing: tickSpacing,
            hooks: address(0)
        });

        // 3. Call PoolManager.unlock to execute the swap
        bytes memory unlockData = abi.encode(
            UnlockData({
                poolKey: poolKey,
                wethAmount: msg.value,
                collateralToken: collateralToken,
                memeToken: memeToken,
                recipient: msg.sender
            })
        );

        bytes memory result = IPoolManager(POOL_MANAGER).unlock(unlockData);
        uint256 collateralReceived = abi.decode(result, (uint256));

        // 4. Approve collateral to Factory and call buyToken
        IERC20(collateralToken).approve(factory, collateralReceived);
        IRWATokenFactory(factory).buyToken(memeToken, collateralReceived);

        // 5. Transfer purchased meme tokens back to the user
        uint256 memeBalance = IERC20(memeToken).balanceOf(address(this));
        require(IERC20(memeToken).transfer(msg.sender, memeBalance), "Meme transfer failed");
    }

    // Uniswap V4 PoolManager unlock callback
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == POOL_MANAGER, "Only PoolManager");

        UnlockData memory uData = abi.decode(data, (UnlockData));
        bool wethIsToken0 = WETH < uData.collateralToken;

        // Execute Swap on PoolManager
        BalanceDelta memory delta = IPoolManager(POOL_MANAGER).swap(
            uData.poolKey,
            SwapParams({
                zeroForOne: wethIsToken0,
                amountSpecified: -int256(uData.wethAmount),
                sqrtPriceLimitX96: wethIsToken0 ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1
            }),
            ""
        );

        int256 wethDelta = wethIsToken0 ? delta.amount0 : delta.amount1;
        int256 collateralDelta = wethIsToken0 ? delta.amount1 : delta.amount0;

        // Settle WETH (transfer WETH to PoolManager and notify settlement)
        uint256 wethOwed = uint256(wethDelta);
        IERC20(WETH).transfer(POOL_MANAGER, wethOwed);
        IPoolManager(POOL_MANAGER).settle(WETH);

        // Take Collateral (withdraw the swapped collateral token to this contract)
        uint256 collateralReceived = uint256(-collateralDelta);
        IPoolManager(POOL_MANAGER).take(uData.collateralToken, address(this), collateralReceived);

        return abi.encode(collateralReceived);
    }
}
