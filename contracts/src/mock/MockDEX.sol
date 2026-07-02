// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

contract MockDEX {
    struct Pool {
        uint256 ethReserve;
        uint256 tokenReserve;
    }

    mapping(address => Pool) public pools;

    event LiquidityAdded(address indexed token, uint256 ethAmount, uint256 tokenAmount);
    event Swap(address indexed token, address indexed user, uint256 ethIn, uint256 tokenOut, uint256 tokenIn, uint256 ethOut);

    function addLiquidity(address token, uint256 tokenAmount) external payable {
        require(msg.value > 0, "Must send ETH");
        require(tokenAmount > 0, "Must send tokens");

        IERC20(token).transferFrom(msg.sender, address(this), tokenAmount);

        Pool storage pool = pools[token];
        pool.ethReserve += msg.value;
        pool.tokenReserve += tokenAmount;

        emit LiquidityAdded(token, msg.value, tokenAmount);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        return numerator / denominator;
    }

    function swapExactETHForTokens(address token, uint256 minAmountOut) external payable returns (uint256) {
        Pool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "No liquidity");

        // Calculate amount out based on constant product formula using current reserve (which does not include msg.value yet)
        uint256 amountOut = getAmountOut(msg.value, pool.ethReserve, pool.tokenReserve);

        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        pool.tokenReserve -= amountOut;
        pool.ethReserve += msg.value;

        IERC20(token).transfer(msg.sender, amountOut);

        emit Swap(token, msg.sender, msg.value, amountOut, 0, 0);
        return amountOut;
    }

    function swapExactTokensForETH(address token, uint256 tokenAmount, uint256 minAmountOut) external returns (uint256) {
        Pool storage pool = pools[token];
        require(pool.ethReserve > 0 && pool.tokenReserve > 0, "No liquidity");

        uint256 amountOut = getAmountOut(tokenAmount, pool.tokenReserve, pool.ethReserve);
        require(amountOut >= minAmountOut, "Slippage limit exceeded");

        IERC20(token).transferFrom(msg.sender, address(this), tokenAmount);

        pool.tokenReserve += tokenAmount;
        pool.ethReserve -= amountOut;

        payable(msg.sender).transfer(amountOut);

        emit Swap(token, msg.sender, 0, 0, tokenAmount, amountOut);
        return amountOut;
    }
}
