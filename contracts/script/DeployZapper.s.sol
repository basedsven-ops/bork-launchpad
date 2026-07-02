// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BorkZapper.sol";

contract DeployZapper is Script {
    address public constant FACTORY_ADDRESS = 0xa3aCd620399cdaB00da2c5F1c0D196e0CB955dD7;

    function run() external {
        vm.startBroadcast();

        BorkZapper zapper = new BorkZapper(FACTORY_ADDRESS);
        console.log("New BorkZapper deployed at:", address(zapper));

        vm.stopBroadcast();
    }
}
