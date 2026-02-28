// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPool.sol";

contract MockAToken is ERC20 {
    address public pool;
    address public underlyingAsset;

    constructor(string memory name, string memory symbol, address _underlyingAsset) ERC20(name, symbol) {
        pool = msg.sender;
        underlyingAsset = _underlyingAsset;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == pool, "Only pool can mint");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == pool, "Only pool can burn");
        _burn(from, amount);
    }
}

contract MockPool is IPool {
    MockAToken public aToken;
    IERC20 public asset;

    constructor(IERC20 _asset) {
        asset = _asset;
        // Deploy aToken dynamically or set it via setter?
        // For simplicity, deploy here.
        aToken = new MockAToken("Aave Mock USDC", "aMUSDC", address(_asset));
    }

    function supply(address _asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override {
        require(_asset == address(asset), "Wrong asset");
        
        // Transfer asset from user to this pool
        asset.transferFrom(msg.sender, address(this), amount); // Aave actually holds funds or aToken holds funds? 
        // In Aave V3, aToken holds logic but usually funds are in aToken contract or pool?
        // Simplified: Pool holds funds.
        
        // Mint aToken to onBehalfOf
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(address _asset, uint256 amount, address to) external override returns (uint256) {
        require(_asset == address(asset), "Wrong asset");

        // Burn aToken from msg.sender (OmniYieldVault)
        aToken.burn(msg.sender, amount); // simplified access control

        // Transfer Asset to 'to'
        asset.transfer(to, amount);

        return amount;
    }
}
