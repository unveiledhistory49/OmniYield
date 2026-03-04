// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStrategy.sol";

/**
 * @title OmniYieldVault
 * @dev ERC4626 Tokenized Vault with auto-compound and performance fees.
 * Delegates yield generation to pluggable strategies (Aave V3, Aerodrome, etc.).
 * 
 * Key features:
 * - harvest() pulls accrued yield from strategy, takes performance fee, re-invests
 * - Configurable performance fee (default 15%, capped at 30%)
 * - Fee recipient address (intended for a Gnosis Safe multisig)
 * - Callable by anyone (keeper/bot pattern for auto-compounding)
 */
contract OmniYieldVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    IStrategy public strategy;
    
    // --- Fee Configuration ---
    address public feeRecipient;
    uint256 public performanceFeeBps; // in basis points (100 = 1%)
    uint256 public constant MAX_FEE_BPS = 3000; // 30% cap
    uint256 public constant FEE_DENOMINATOR = 10000;

    // --- Harvest Tracking ---
    uint256 public lastHarvestTimestamp;
    uint256 public totalHarvestedProfit;
    uint256 public totalFeesCollected;

    // --- Events ---
    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    event Harvested(uint256 profit, uint256 fee, uint256 reinvested);
    event FeeCollected(address indexed recipient, uint256 amount);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event PerformanceFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    constructor(
        IERC20 asset_, 
        string memory name_, 
        string memory symbol_, 
        IStrategy strategy_,
        address feeRecipient_,
        uint256 performanceFeeBps_
    )
        ERC4626(asset_)
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        require(address(strategy_) != address(0), "Invalid strategy");
        require(address(strategy_.asset()) == address(asset_), "Asset mismatch");
        require(feeRecipient_ != address(0), "Invalid fee recipient");
        require(performanceFeeBps_ <= MAX_FEE_BPS, "Fee too high");

        strategy = strategy_;
        feeRecipient = feeRecipient_;
        performanceFeeBps = performanceFeeBps_;
        
        // Approve strategy to spend asset
        IERC20(asset_).approve(address(strategy_), type(uint256).max);
    }

    // ═══════════════════════════════════════════
    //              HARVEST & COMPOUND
    // ═══════════════════════════════════════════

    /**
     * @dev Harvests yield from the strategy, takes performance fee, and re-invests.
     * Can be called by anyone (keeper pattern).
     * @return profit Total profit harvested before fees
     */
    function harvest() external returns (uint256 profit) {
        profit = strategy.harvest();
        
        if (profit == 0) {
            lastHarvestTimestamp = block.timestamp;
            emit Harvested(0, 0, 0);
            return 0;
        }

        uint256 fee = 0;
        uint256 reinvested = profit;

        // Calculate and distribute fee
        if (performanceFeeBps > 0 && feeRecipient != address(0)) {
            fee = (profit * performanceFeeBps) / FEE_DENOMINATOR;
            if (fee > 0) {
                IERC20(asset()).safeTransfer(feeRecipient, fee);
                totalFeesCollected += fee;
                emit FeeCollected(feeRecipient, fee);
            }
            reinvested = profit - fee;
        }

        // Re-invest remaining profit into strategy
        if (reinvested > 0) {
            strategy.invest(reinvested);
        }

        totalHarvestedProfit += profit;
        lastHarvestTimestamp = block.timestamp;

        emit Harvested(profit, fee, reinvested);
    }

    /**
     * @dev Compounds any idle assets sitting in the vault + harvests yield.
     * Convenience function combining idle sweep and harvest.
     */
    function compound() external returns (uint256 profit) {
        // First, sweep any idle assets into strategy
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        if (idle > 0) {
            strategy.invest(idle);
        }

        // Then harvest
        profit = strategy.harvest();
        
        if (profit > 0) {
            uint256 fee = 0;
            uint256 reinvested = profit;

            if (performanceFeeBps > 0 && feeRecipient != address(0)) {
                fee = (profit * performanceFeeBps) / FEE_DENOMINATOR;
                if (fee > 0) {
                    IERC20(asset()).safeTransfer(feeRecipient, fee);
                    totalFeesCollected += fee;
                    emit FeeCollected(feeRecipient, fee);
                }
                reinvested = profit - fee;
            }

            if (reinvested > 0) {
                strategy.invest(reinvested);
            }

            totalHarvestedProfit += profit;
            emit Harvested(profit, fee, reinvested);
        }

        lastHarvestTimestamp = block.timestamp;
    }

    // ═══════════════════════════════════════════
    //              ADMIN FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @dev Updates the yield strategy. Only callable by owner.
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
     * @dev Updates the fee recipient address. Only callable by owner.
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid fee recipient");
        address old = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(old, newRecipient);
    }

    /**
     * @dev Updates the performance fee. Only callable by owner. Capped at MAX_FEE_BPS.
     */
    function setPerformanceFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 old = performanceFeeBps;
        performanceFeeBps = newFeeBps;
        emit PerformanceFeeUpdated(old, newFeeBps);
    }

    // ═══════════════════════════════════════════
    //              VIEW FUNCTIONS
    // ═══════════════════════════════════════════

    /**
     * @dev Returns total assets: strategy balance + idle vault balance.
     */
    function totalAssets() public view override returns (uint256) {
        return strategy.totalAssets() + IERC20(asset()).balanceOf(address(this));
    }

    /**
     * @dev Returns the net APY after fees, as a view convenience.
     * @param grossApyBps The gross APY in basis points.
     * @return netApyBps The net APY after performance fee deduction.
     */
    function netApy(uint256 grossApyBps) external view returns (uint256 netApyBps) {
        netApyBps = grossApyBps - ((grossApyBps * performanceFeeBps) / FEE_DENOMINATOR);
    }

    // ═══════════════════════════════════════════
    //           INTERNAL OVERRIDES
    // ═══════════════════════════════════════════

    /** @dev Internal deposit: supplies assets to the active strategy. */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        super._deposit(caller, receiver, assets, shares);
        strategy.invest(assets);
    }

    /** @dev Internal withdraw: withdraws assets from the active strategy. */
    function _withdraw(address caller, address receiver, address _owner, uint256 assets, uint256 shares) internal override {
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        if (assets > vaultBalance) {
            uint256 toWithdraw = assets - vaultBalance;
            strategy.divest(toWithdraw);
        }
        
        super._withdraw(caller, receiver, _owner, assets, shares);
    }
}
