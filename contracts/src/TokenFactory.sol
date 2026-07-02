// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RobinhoodMemeToken.sol";

interface IMockDEX {
    function addLiquidity(address token, uint256 tokenAmount) external payable;
}

contract TokenFactory {
    address public dexAddress;
    address[] public deployedTokens;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator,
        uint256 ethAmount
    );

    constructor(address _dexAddress) {
        dexAddress = _dexAddress;
    }

    function createToken(string memory name, string memory symbol) external payable returns (address) {
        require(msg.value > 0, "Initial liquidity (ETH) required");

        uint256 initialSupply = 1_000_000_000 * 10**18; // 1 Billion tokens
        uint256 creatorAllocation = (initialSupply * 20) / 100; // 20%
        uint256 dexAllocation = initialSupply - creatorAllocation; // 80%

        // Deploy the new token, initially owned by this contract
        RobinhoodMemeToken token = new RobinhoodMemeToken(name, symbol, initialSupply, address(this));

        // Transfer 20% to the creator
        token.transfer(msg.sender, creatorAllocation);

        // Approve DEX to pull the 80% allocation
        token.approve(dexAddress, dexAllocation);

        // Add liquidity to the DEX
        IMockDEX(dexAddress).addLiquidity{value: msg.value}(address(token), dexAllocation);

        deployedTokens.push(address(token));

        emit TokenCreated(address(token), name, symbol, msg.sender, msg.value);

        return address(token);
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }
}
