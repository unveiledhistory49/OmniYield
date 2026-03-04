// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IStrategy.sol";
import "../interfaces/IPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AaveV3Strategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable _asset;
    IPool public immutable pool;
    IERC20 public immutable aToken;
    uint256 public invested; // Track principal invested

    constructor(IERC20 asset_, IPool pool_, IERC20 aToken_) {
        _asset = asset_;
        pool = pool_;
        aToken = aToken_;
        invested = 0;
        
        // Approve the Aave pool to spend our underlying asset infinitely
        _asset.forceApprove(address(pool_), type(uint256).max);
    }

    function invest(uint256 amount) external override {
        // 1. Pull assets from the Vault into this Strategy
        _asset.safeTransferFrom(msg.sender, address(this), amount);
        invested += amount;
        
        // 2. Supply those assets to Aave
        pool.supply(address(_asset), amount, address(this), 0);
    }

    function divest(uint256 amount) external override returns (uint256) {
        // 1. Withdraw from Aave directly to the Vault (msg.sender)
        uint256 withdrawn = pool.withdraw(address(_asset), amount, msg.sender);
        
        // Reduce invested tracking
        if (withdrawn >= invested) {
            invested = 0;
        } else {
            invested -= withdrawn;
        }
        
        return withdrawn;
    }

    /**
     * @dev Harvests accrued Aave yield.
     * Calculates profit as (aToken balance - invested principal),
     * withdraws profit from Aave, and sends to msg.sender (vault).
     */
    function harvest() external override returns (uint256 profit) {
        uint256 currentBalance = aToken.balanceOf(address(this));
        if (currentBalance > invested) {
            profit = currentBalance - invested;
            // Withdraw only the profit from Aave, send to vault (msg.sender)
            pool.withdraw(address(_asset), profit, msg.sender);
        }
    }

    function totalAssets() external view override returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    function asset() external view override returns (IERC20) {
        return _asset;
    }
}
