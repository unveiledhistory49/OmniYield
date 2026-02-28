// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategy.sol";

/**
 * @title OmniYieldVault
 * @dev ERC4626 Tokenized Vault for yielding strategies.
 * Implementation delegates to Aave V3.
 */
contract OmniYieldVault is ERC4626, Ownable {
    IStrategy public strategy;
    address public pendingStrategy;

    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);

    constructor(
        IERC20 asset_, 
        string memory name_, 
        string memory symbol_, 
        IStrategy strategy_
    )
        ERC4626(asset_)
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        require(address(strategy_) != address(0), "Invalid strategy");
        require(address(strategy_.asset()) == address(asset_), "Asset mismatch");
        strategy = strategy_;
        
        // Approve strategy to spend asset infinitely
        IERC20(asset_).approve(address(strategy_), type(uint256).max);
    }

    /**
     * @dev Admin function to update the strategy.
     */
    function setStrategy(IStrategy newStrategy) external onlyOwner {
        require(address(newStrategy) != address(0), "Invalid strategy");
        require(address(newStrategy.asset()) == address(asset()), "Asset mismatch");
        
        address oldStrategy = address(strategy);
        
        // Revoke old allowance
        IERC20(asset()).approve(oldStrategy, 0);
        
        strategy = newStrategy;
        
        // Approve new allowance
        IERC20(asset()).approve(address(newStrategy), type(uint256).max);
        
        emit StrategyUpdated(oldStrategy, address(newStrategy));
    }

    /**
     * @dev See {IERC4626-totalAssets}.
     * Returns the total assets managed by the vault (held in the active Strategy).
     */
    function totalAssets() public view override returns (uint256) {
        return strategy.totalAssets() + IERC20(asset()).balanceOf(address(this));
    }

    /** @dev Internal deposit: supplies assets to the active strategy. */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        // Supply to Strategy (vault holds assets at this point)
        strategy.invest(assets);
    }

    /** @dev Internal withdraw: withdraws assets from the active strategy. */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares) internal override {
        // Find if we need to pull from the strategy
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        if (assets > vaultBalance) {
            uint256 toWithdraw = assets - vaultBalance;
            strategy.divest(toWithdraw);
        }
        
        // Then ERC4626 logic handles burning shares and transferring assets to receiver
        super._withdraw(caller, receiver, owner, assets, shares);
    }
}
