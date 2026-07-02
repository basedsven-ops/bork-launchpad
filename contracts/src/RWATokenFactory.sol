// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RobinhoodMemeToken.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct BalanceDelta {
    int256 amount0;
    int256 amount1;
}

struct SwapParams {
    bool zeroForOne;
    int256 amountSpecified;
    uint160 sqrtPriceLimitX96;
}

interface IPoolManager {
    function initialize(PoolKey memory key, uint160 sqrtPriceX96) external returns (int24 tick);
    function unlock(bytes calldata data) external returns (bytes memory);
    function swap(
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) external returns (BalanceDelta memory delta);
    function settle(address currency) external returns (uint256);
    function take(address currency, address to, uint256 amount) external;
}

interface IPositionManager {
    function modifyLiquidities(bytes calldata unlockData, uint256 deadline) external payable;
}

interface IPermit2 {
    function approve(address token, address spender, uint160 amount, uint48 expiration) external;
}

contract RWATokenFactory {
    struct TokenInfo {
        address creator;
        address collateralToken;
        uint256 targetCollateral;
        uint256 currentCollateral; 
        uint256 memeSold;
        bool completed;
        uint256 totalMemeSupply;
        string tokenURI;
        
        uint256 virtualMemeReserve;
        uint256 virtualCollateralReserve;
    }

    address public constant POOL_MANAGER        = 0x8366a39CC670B4001A1121B8F6A443A643e40951;
    address public constant POSITION_MANAGER    = 0x58daec3116aae6D93017bAAea7749052E8a04fA7;
    address public constant PERMIT2             = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    uint24  public constant POOL_FEE            = 3000;

    mapping(address => TokenInfo) public tokens;
    address[] public allTokens;

    event TokenLaunched(address indexed tokenAddress, address indexed creator, address collateralToken, uint256 targetCollateral, string tokenURI);
    event TokenBought(address indexed tokenAddress, address indexed buyer, uint256 collateralAmount, uint256 memeAmount);
    event TokenSold(address indexed tokenAddress, address indexed seller, uint256 memeAmount, uint256 collateralAmount);
    event LiquidityAdded(address indexed tokenAddress, address indexed poolAddress, uint256 tokenId, uint256 amount0, uint256 amount1);

    function launchToken(
        string memory name,
        string memory symbol,
        address collateralToken,
        uint256 targetCollateral,
        string memory tokenURI
    ) external returns (address) {
        require(targetCollateral > 0, "Target must be > 0");
        require(collateralToken != address(0), "Invalid collateral");

        RobinhoodMemeToken token = new RobinhoodMemeToken(name, symbol, 1_000_000_000 * 10**18, address(this));
        address tokenAddress = address(token);

        uint256 vCollateral = (targetCollateral * 273) / 800; 

        tokens[tokenAddress] = TokenInfo({
            creator:           msg.sender,
            collateralToken:   collateralToken,
            targetCollateral:  targetCollateral,
            currentCollateral: 0,
            memeSold:          0,
            completed:         false,
            totalMemeSupply:   token.totalSupply(),
            tokenURI:          tokenURI,
            virtualMemeReserve: 1_073_000_000 * 10**18,
            virtualCollateralReserve: vCollateral
        });
        allTokens.push(tokenAddress);

        emit TokenLaunched(tokenAddress, msg.sender, collateralToken, targetCollateral, tokenURI);
        return tokenAddress;
    }

    function getBuyPrice(address tokenAddress, uint256 collateralAmount) public view returns (uint256 memeOut) {
        TokenInfo memory info = tokens[tokenAddress];
        if (info.completed || collateralAmount == 0) return 0;
        
        uint256 k = info.virtualMemeReserve * info.virtualCollateralReserve;
        uint256 newReserveCollateral = info.virtualCollateralReserve + collateralAmount;
        // Round UP newReserveMeme to round DOWN memeOut
        uint256 newReserveMeme = (k + newReserveCollateral - 1) / newReserveCollateral;
        memeOut = info.virtualMemeReserve - newReserveMeme;
    }

    function getSellPrice(address tokenAddress, uint256 memeAmount) public view returns (uint256 collateralOut) {
        TokenInfo memory info = tokens[tokenAddress];
        if (info.completed || memeAmount == 0) return 0;
        
        uint256 k = info.virtualMemeReserve * info.virtualCollateralReserve;
        uint256 newReserveMeme = info.virtualMemeReserve + memeAmount;
        // Round UP newReserveCollateral to round DOWN collateralOut
        uint256 newReserveCollateral = (k + newReserveMeme - 1) / newReserveMeme;
        collateralOut = info.virtualCollateralReserve - newReserveCollateral;
        
        // Safety cap to prevent underflow
        if (collateralOut > info.currentCollateral) {
            collateralOut = info.currentCollateral;
        }
    }

    function buyToken(address tokenAddress, uint256 collateralAmount) external {
        TokenInfo storage info = tokens[tokenAddress];
        require(info.creator != address(0), "Token does not exist");
        require(!info.completed, "Bonding curve completed");
        require(collateralAmount > 0, "Amount > 0");

        uint256 needed = info.targetCollateral - info.currentCollateral;
        uint256 deposit = collateralAmount > needed ? needed : collateralAmount;

        uint256 memeOut = getBuyPrice(tokenAddress, deposit);

        info.currentCollateral += deposit;
        info.memeSold += memeOut;
        info.virtualCollateralReserve += deposit;
        info.virtualMemeReserve -= memeOut;

        require(IERC20(info.collateralToken).transferFrom(msg.sender, address(this), deposit), "Collateral tx failed");
        require(IERC20(tokenAddress).transfer(msg.sender, memeOut), "Meme tx failed");
        emit TokenBought(tokenAddress, msg.sender, deposit, memeOut);

        if (info.currentCollateral >= info.targetCollateral) {
            _graduate(tokenAddress);
        }
    }

    function sellToken(address tokenAddress, uint256 memeAmount) external {
        TokenInfo storage info = tokens[tokenAddress];
        require(info.creator != address(0), "Token does not exist");
        require(!info.completed, "Bonding curve completed");
        require(memeAmount > 0, "Amount > 0");
        require(IERC20(tokenAddress).balanceOf(msg.sender) >= memeAmount, "Insufficient balance");

        uint256 collateralOut = getSellPrice(tokenAddress, memeAmount);

        info.currentCollateral -= collateralOut;
        info.memeSold -= memeAmount;
        info.virtualCollateralReserve -= collateralOut;
        info.virtualMemeReserve += memeAmount;

        require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), memeAmount), "Meme tx failed");
        require(IERC20(info.collateralToken).transfer(msg.sender, collateralOut), "Collateral tx failed");
        emit TokenSold(tokenAddress, msg.sender, memeAmount, collateralOut);
    }

    function _graduate(address tokenAddress) internal {
        TokenInfo storage info = tokens[tokenAddress];
        info.completed = true;

        uint256 memeLpAmount      = IERC20(tokenAddress).balanceOf(address(this));
        uint256 collateralLpAmount = info.currentCollateral;

        bool memeIsToken0 = tokenAddress < info.collateralToken;
        (address token0, address token1) = memeIsToken0
            ? (tokenAddress, info.collateralToken)
            : (info.collateralToken, tokenAddress);

        uint256 amount0 = memeIsToken0 ? memeLpAmount      : collateralLpAmount;
        uint256 amount1 = memeIsToken0 ? collateralLpAmount : memeLpAmount;

        PoolKey memory key = PoolKey({
            currency0: token0,
            currency1: token1,
            fee: POOL_FEE,
            tickSpacing: 60,
            hooks: address(0)
        });

        uint256 ratioX192   = (amount1 << 192) / amount0;
        uint160 sqrtPriceX96 = uint160(_sqrt(ratioX192));

        // Initialize pool (wrap in try/catch in case it's already initialized)
        try IPoolManager(POOL_MANAGER).initialize(key, sqrtPriceX96) {} catch {}

        // Approve tokens to Permit2
        IERC20(token0).approve(PERMIT2, type(uint256).max);
        IERC20(token1).approve(PERMIT2, type(uint256).max);

        // Approve tokens from Permit2 to PositionManager
        IPermit2(PERMIT2).approve(token0, POSITION_MANAGER, type(uint160).max, type(uint48).max);
        IPermit2(PERMIT2).approve(token1, POSITION_MANAGER, type(uint160).max, type(uint48).max);

        uint128 liquidity = uint128(amount0 < amount1 ? amount0 : amount1);
        if (liquidity == 0) liquidity = 1;

        // V4 PositionManager modifyLiquidities command encoding
        // Actions: MINT_POSITION (0x02), SETTLE_PAIR (0x0d)
        bytes memory actions = abi.encodePacked(uint8(2), uint8(13));
        bytes[] memory params = new bytes[](2);
        
        params[0] = abi.encode(
            key,
            int24(-887220), // tickLower (full range)
            int24(887220),  // tickUpper
            uint256(liquidity),
            amount0,        // amount0Max
            amount1,        // amount1Max
            info.creator,   // recipient
            ""              // hookData
        );
        params[1] = abi.encode(token0, token1);

        IPositionManager(POSITION_MANAGER).modifyLiquidities(abi.encode(actions, params), block.timestamp);

        emit LiquidityAdded(tokenAddress, POSITION_MANAGER, 0, amount0, amount1);
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getPool(address tokenAddress) external view returns (address) {
        return POOL_MANAGER;
    }

    function getTokenURI(address tokenAddress) external view returns (string memory) {
        return tokens[tokenAddress].tokenURI;
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
