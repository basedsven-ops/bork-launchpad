// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RobinhoodMemeToken.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
    function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool);
}

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;
    function token0() external view returns (address);
    function token1() external view returns (address);
    function mint(
        address recipient,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata data
    ) external returns (uint256 amount0, uint256 amount1);
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

    address public constant UNISWAP_V3_FACTORY  = 0x1f7d7550B1b028f7571E69A784071F0205FD2EfA;
    address public constant POSITION_MANAGER    = 0xCaf681a66D020601342297493863E78C959E5cb2;
    uint24  public constant POOL_FEE            = 10000;

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

        address pool = IUniswapV3Factory(UNISWAP_V3_FACTORY).getPool(token0, token1, POOL_FEE);
        if (pool == address(0)) {
            pool = IUniswapV3Factory(UNISWAP_V3_FACTORY).createPool(token0, token1, POOL_FEE);
        }

        uint256 ratioX192   = (amount1 << 192) / amount0;
        uint160 sqrtPriceX96 = uint160(_sqrt(ratioX192));
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);

        IERC20(token0).approve(pool, amount0);
        IERC20(token1).approve(pool, amount1);

        int24 tickLower = -887200;
        int24 tickUpper =  887200;

        uint128 liquidity = uint128(amount0 < amount1 ? amount0 : amount1);
        if (liquidity == 0) liquidity = 1;

        (uint256 amt0, uint256 amt1) = IUniswapV3Pool(pool).mint(
            info.creator,
            tickLower,
            tickUpper,
            liquidity,
            abi.encode(token0, token1, address(this))
        );

        emit LiquidityAdded(tokenAddress, pool, 0, amt0, amt1);
    }

    function uniswapV3MintCallback(uint256 amount0Owed, uint256 amount1Owed, bytes calldata data) external {
        (address token0, address token1, ) = abi.decode(data, (address, address, address));
        address expectedPool = IUniswapV3Factory(UNISWAP_V3_FACTORY).getPool(token0, token1, POOL_FEE);
        require(msg.sender == expectedPool, "Unauthorized callback");

        if (amount0Owed > 0) IERC20(token0).transfer(msg.sender, amount0Owed);
        if (amount1Owed > 0) IERC20(token1).transfer(msg.sender, amount1Owed);
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getPool(address tokenAddress) external view returns (address) {
        TokenInfo storage info = tokens[tokenAddress];
        (address token0, address token1) = tokenAddress < info.collateralToken
            ? (tokenAddress, info.collateralToken)
            : (info.collateralToken, tokenAddress);
        return IUniswapV3Factory(UNISWAP_V3_FACTORY).getPool(token0, token1, POOL_FEE);
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
