// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IStrategy
 * @dev Interface for yield-generating strategies that plug into OmniYieldVault.
 */
interface IStrategy {
    /**
     * @dev Invests assets into the underlying protocol.
     * @param amount The amount of underlying assets to invest.
     */
    function invest(uint256 amount) external;

    /**
     * @dev Divests assets from the underlying protocol and returns them to the vault.
     * @param amount The amount of underlying assets to withdraw.
     * @return The actual amount withdrawn (could differ slightly due to protocol mechanics).
     */
    function divest(uint256 amount) external returns (uint256);

    /**
     * @dev Harvests accrued yield from the underlying protocol.
     * Withdraws only the profit (yield above principal) and sends it to the caller (vault).
     * @return profit The amount of profit harvested.
     */
    function harvest() external returns (uint256 profit);

    /**
     * @dev Returns the total amount of underlying assets currently managed by this strategy.
     */
    function totalAssets() external view returns (uint256);

    /**
     * @dev Returns the underlying asset token this strategy operates on.
     */
    function asset() external view returns (IERC20);
}
