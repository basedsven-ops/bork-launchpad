// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BorkZapper.sol";

contract ZapperTest is Test {
    address public constant FACTORY = 0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7;
    address public constant MEME = 0x04E81F904174C552Ee99D8C77Cc4291352Cc8adE;
    address public constant TSLA = 0x322F0929c4625eD5bAd873c95208D54E1c003b2d;

    BorkZapper public zapper;

    function setUp() public {
        vm.createSelectFork("https://rpc.mainnet.chain.robinhood.com");
        // Deploy our local BorkZapper bytecode for testing
        zapper = new BorkZapper(FACTORY);
    }

    function testZapBuy() public {
        // Fund this test contract with some ETH
        vm.deal(address(this), 10 ether);

        // Call zapBuy on our locally deployed zapper
        zapper.zapBuy{value: 0.001 ether}(
            MEME,
            TSLA,
            50000,
            1000
        );
    }
}
