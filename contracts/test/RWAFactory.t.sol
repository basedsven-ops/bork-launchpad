// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RWATokenFactory.sol";
import "../src/RobinhoodMemeToken.sol";

// Simple mock for RWA collateral
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract RWAFactoryTest is Test {
    RWATokenFactory public factory;
    MockERC20 public rddt;
    address public user = address(0xDEAdBEEf);

    function setUp() public {
        factory = new RWATokenFactory();
        rddt = new MockERC20();
    }

    function testLaunchToken() public {
        uint256 targetCollateral = 10 * 10**18;
        
        vm.prank(user);
        address tokenAddress = factory.launchToken(
            "RedditGold",
            "RDGD",
            address(rddt),
            targetCollateral,
            "ipfs://mock"
        );

        assertTrue(tokenAddress != address(0), "Token deployed");

        (
            address creator,
            address collateralToken,
            uint256 target,
            uint256 current,
            uint256 memeSold,
            bool completed,
            uint256 totalMemeSupply,
            string memory tokenURI,
            uint256 vMeme,
            uint256 vCol
        ) = factory.tokens(tokenAddress);

        assertEq(creator, user);
        assertEq(target, targetCollateral);
        assertEq(current, 0);
        assertEq(memeSold, 0);
        assertFalse(completed);
        assertEq(totalMemeSupply, 1_000_000_000 * 10**18);
        assertEq(vMeme, 1_073_000_000 * 10**18);
        assertEq(vCol, (targetCollateral * 273) / 800);
    }

    function testVirtualAMMMath_BuyAndSell() public {
        uint256 targetCollateral = 100 * 10**18;
        
        vm.prank(user);
        address tokenAddress = factory.launchToken("TEST", "TST", address(rddt), targetCollateral, "");

        rddt.mint(user, 1000 * 10**18);
        
        vm.startPrank(user);
        rddt.approve(address(factory), 10 * 10**18);

        // Buy 10 RDDT worth of tokens
        uint256 expectedMemeOut = factory.getBuyPrice(tokenAddress, 10 * 10**18);
        assertTrue(expectedMemeOut > 0, "Should get meme out");

        factory.buyToken(tokenAddress, 10 * 10**18);
        
        uint256 userMemeBal = RobinhoodMemeToken(tokenAddress).balanceOf(user);
        assertEq(userMemeBal, expectedMemeOut, "User got correct meme tokens");

        // Price should have gone up. So selling the same meme amount should yield LESS collateral 
        // than we put in originally (due to constant product formula slippage).
        RobinhoodMemeToken(tokenAddress).approve(address(factory), userMemeBal);
        
        uint256 expectedColOut = factory.getSellPrice(tokenAddress, userMemeBal);
        assertApproxEqAbs(expectedColOut, 10 * 10**18, 1, "Selling right after buying without fee gives exact collateral back (allow 1 wei rounding)");

        uint256 colBalBefore = rddt.balanceOf(user);
        factory.sellToken(tokenAddress, userMemeBal);
        uint256 colBalAfter = rddt.balanceOf(user);

        assertEq(colBalAfter - colBalBefore, expectedColOut, "Got correct collateral back");
        vm.stopPrank();
    }
}
