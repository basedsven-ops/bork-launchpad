// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RWATokenFactory.sol";
import "../src/BorkZapper.sol";

contract DeployFactory is Script {
    function run() external {
        // Retrieve private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Factory
        RWATokenFactory factory = new RWATokenFactory();

        // Deploy the Zapper
        BorkZapper zapper = new BorkZapper(address(factory));

        vm.stopBroadcast();

        console.log("RWATokenFactory deployed at:", address(factory));
        console.log("BorkZapper deployed at:", address(zapper));
    }
}
