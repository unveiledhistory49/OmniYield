// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockStrategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable _asset;
    uint256 public simulatedYield;

    constructor(IERC20 asset_) {
        _asset = asset_;
    }

    function invest(uint256 amount) external override {
        // Vault has already transferred assets to itself and approved the strategy.
        // The strategy pulls the funds from the vault.
        _asset.safeTransferFrom(msg.sender, address(this), amount);
    }

    function divest(uint256 amount) external override returns (uint256) {
        // Transfer assets back to the caller (the Vault)
        // If amount is greater than our balance, just transfer what we have.
        uint256 balance = _asset.balanceOf(address(this));
        uint256 toTransfer = amount > balance ? balance : amount;
        
        _asset.safeTransfer(msg.sender, toTransfer);
        return toTransfer;
    }

    function totalAssets() external view override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function asset() external view override returns (IERC20) {
        return _asset;
    }
}
