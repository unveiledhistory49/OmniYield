// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SimpleYieldStrategy
 * @dev Minimal yield strategy for testnet demonstration.
 * Implements the IStrategy interface with direct token custody.
 * Yield is generated externally (e.g. keeper bot, external protocol).
 * 
 * Production strategies (AaveV3Strategy, AerodromeStrategy) extend
 * the same IStrategy interface with real DeFi protocol integrations.
 */
contract SimpleYieldStrategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable _asset;
    uint256 public invested; // Track principal invested

    constructor(IERC20 asset_) {
        _asset = asset_;
    }

    function invest(uint256 amount) external override {
        _asset.safeTransferFrom(msg.sender, address(this), amount);
        invested += amount;
    }

    function divest(uint256 amount) external override returns (uint256) {
        uint256 balance = _asset.balanceOf(address(this));
        uint256 toTransfer = amount > balance ? balance : amount;
        
        _asset.safeTransfer(msg.sender, toTransfer);
        
        if (toTransfer >= invested) {
            invested = 0;
        } else {
            invested -= toTransfer;
        }
        
        return toTransfer;
    }

    /**
     * @dev Harvests profit (balance above invested principal).
     * Sends profit to msg.sender (the vault).
     */
    function harvest() external override returns (uint256 profit) {
        uint256 balance = _asset.balanceOf(address(this));
        if (balance > invested) {
            profit = balance - invested;
            _asset.safeTransfer(msg.sender, profit);
        }
    }

    function totalAssets() external view override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function asset() external view override returns (IERC20) {
        return _asset;
    }
}
