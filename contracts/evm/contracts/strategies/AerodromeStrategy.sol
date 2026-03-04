// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Mock interface for Aerodrome Router/Gauge
interface IAerodromeRouter {
    function addLiquidity(address tokenA, address tokenB, bool stable, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
    function removeLiquidity(address tokenA, address tokenB, bool stable, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB);
}

interface IAerodromeGauge {
    function deposit(uint256 amount, uint256 tokenId) external;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

contract AerodromeStrategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable _asset;
    
    // For a real integration we'd swap half to the paired asset, add liquidity, and stake LP tokens in the gauge.
    // For this prototype, we simulate holding the LP position balance directly.
    uint256 private _mockLpBalance;

    constructor(IERC20 asset_) {
        _asset = asset_;
    }

    function invest(uint256 amount) external override {
        _asset.safeTransferFrom(msg.sender, address(this), amount);
        _mockLpBalance += amount;
    }

    function divest(uint256 amount) external override returns (uint256) {
        require(_mockLpBalance >= amount, "Not enough LP mock balance");
        _mockLpBalance -= amount;
        
        _asset.safeTransfer(msg.sender, amount);
        return amount;
    }

    /**
     * @dev Harvests accrued yield. Profit = actual balance - tracked LP balance.
     */
    function harvest() external override returns (uint256 profit) {
        uint256 balance = _asset.balanceOf(address(this));
        if (balance > _mockLpBalance) {
            profit = balance - _mockLpBalance;
            _asset.safeTransfer(msg.sender, profit);
        }
    }

    function totalAssets() external view override returns (uint256) {
        return _mockLpBalance;
    }

    function asset() external view override returns (IERC20) {
        return _asset;
    }
}
