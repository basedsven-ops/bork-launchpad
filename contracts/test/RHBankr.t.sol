// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/mock/MockDEX.sol";
import "../src/TokenFactory.sol";
import "../src/RobinhoodMemeToken.sol";

contract RHBankrTest is Test {
    MockDEX public dex;
    TokenFactory public factory;

    address public alice = address(0x1);

    function setUp() public {
        dex = new MockDEX();
        factory = new TokenFactory(address(dex));
        vm.deal(alice, 10 ether);
    }

    function testCreateTokenAndLiquidity() public {
        vm.startPrank(alice);

        string memory name = "Robinhood Gold";
        string memory symbol = "GOLD";
        uint256 ethLiquidity = 1 ether;

        address tokenAddress = factory.createToken{value: ethLiquidity}(name, symbol);
        assertTrue(tokenAddress != address(0));

        RobinhoodMemeToken token = RobinhoodMemeToken(tokenAddress);

        // Verify supply allocations
        uint256 expectedTotalSupply = 1_000_000_000 * 10**18;
        assertEq(token.totalSupply(), expectedTotalSupply);
        assertEq(token.balanceOf(alice), expectedTotalSupply * 20 / 100);
        assertEq(token.balanceOf(address(dex)), expectedTotalSupply * 80 / 100);

        // Verify pool status in MockDEX
        (uint256 ethReserve, uint256 tokenReserve) = dex.pools(tokenAddress);
        assertEq(ethReserve, ethLiquidity);
        assertEq(tokenReserve, expectedTotalSupply * 80 / 100);

        vm.stopPrank();
    }

    function testSwap() public {
        vm.startPrank(alice);

        address tokenAddress = factory.createToken{value: 1 ether}("Test Token", "TST");
        RobinhoodMemeToken token = RobinhoodMemeToken(tokenAddress);

        // Alice swaps 0.1 ETH for TST tokens
        uint256 ethIn = 0.1 ether;
        uint256 minTokensOut = 0; // Accept any for testing

        uint256 aliceTokenBalanceBefore = token.balanceOf(alice);
        uint256 tokensOut = dex.swapExactETHForTokens{value: ethIn}(tokenAddress, minTokensOut);

        assertTrue(tokensOut > 0);
        assertEq(token.balanceOf(alice), aliceTokenBalanceBefore + tokensOut);

        // Verify pool reserves adjusted
        (uint256 ethReserve, uint256 tokenReserve) = dex.pools(tokenAddress);
        assertEq(ethReserve, 1.1 ether);
        assertEq(tokenReserve, (1_000_000_000 * 10**18 * 80 / 100) - tokensOut);

        vm.stopPrank();
    }
}
