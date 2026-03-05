<div align="center">

# 🚀 OmniYield

**Cross-Chain DeFi Yield Aggregator**

*Maximize yield across Base & Solana with auto-compounding ERC-4626 vaults, gasless deposits, and transparent fee management.*

[![Live Demo](https://img.shields.io/badge/🔗_Live_Demo-omniyield.vercel.app-7c3aed?style=for-the-badge)](https://omniyield.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-37%2F37_Passing-00ff88?style=for-the-badge)](#test-suite)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)

</div>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🏦 **ERC-4626 Vault** | Industry-standard tokenized vault with deposit/withdraw/mint/redeem |
| 🔄 **Auto-Compounding** | `harvest()` pulls yield from strategies, deducts fees, and re-invests automatically |
| 💰 **Performance Fee System** | Configurable fee (15% default, 30% cap) sent to multisig-ready recipient |
| ⛽ **Gasless Deposits** | Account Abstraction via Pimlico — users deposit without paying gas |
| 🌉 **Cross-Chain Bridging** | deBridge integration for seamless cross-chain transfers |
| 🔗 **Dual-Chain Wallets** | Simultaneous Solana (Phantom) + EVM (wagmi/RainbowKit) wallet support |
| 📊 **Live Analytics** | Real-time data from DefiLlama, CoinGecko, and on-chain reads |
| 🛡️ **Fee Transparency** | On-chain fee tracking: net APY, total harvested, fees collected, fee recipient |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Vaults  │ │Portfolio │ │   Analytics      │ │
│  │  Detail  │ │  (Real   │ │  (DefiLlama +    │ │
│  │  + Fees  │ │ On-Chain)│ │   CoinGecko)     │ │
│  └────┬─────┘ └────┬─────┘ └──────────────────┘ │
│       │            │                             │
│  ┌────┴────────────┴──────────────────────────┐  │
│  │  wagmi + viem  │  @solana/wallet-adapter   │  │
│  └────────────────┴───────────────────────────┘  │
└──────────────────────┬───────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐  ┌───────────┐  ┌──────────┐
   │  Base   │  │  deBridge  │  │  Solana  │
   │ Sepolia │  │  (Bridge)  │  │          │
   └────┬────┘  └───────────┘  └──────────┘
        │
   ┌────┴────────────────────────┐
   │     OmniYieldVault (V2)     │
   │  ┌────────────────────────┐ │
   │  │  ERC-4626 + Ownable   │ │
   │  │  ───────────────────   │ │
   │  │  harvest() → fees →   │ │
   │  │  reinvest remainder    │ │
   │  │  compound() → sweep   │ │
   │  │  + harvest             │ │
   │  └──────────┬─────────────┘ │
   │             │               │
   │  ┌──────────┴─────────────┐ │
   │  │  IStrategy (Pluggable) │ │
   │  │  ├─ AaveV3Strategy     │ │
   │  │  ├─ AerodromeStrategy  │ │
   │  │  └─ SimpleYieldStrategy│ │
   │  └────────────────────────┘ │
   └─────────────────────────────┘
```

---

## 📋 Smart Contracts

### Deployed on Base Sepolia (Chain ID: 84532)

| Contract | Address | BaseScan |
|----------|---------|----------|
| **OmniYieldVault** | `0x88c115C3Fab2F18fFEAC14eC27E65C3854C4dEc4` | [View](https://sepolia.basescan.org/address/0x88c115C3Fab2F18fFEAC14eC27E65C3854C4dEc4) |
| **SimpleYieldStrategy** | `0x11d5A24060C6cECDefBEE4231272A72822c2B446` | [View](https://sepolia.basescan.org/address/0x11d5A24060C6cECDefBEE4231272A72822c2B446) |
| TestUSDC | `0xd702668C0E1BB35166F53965e74399f535fe32a4` | [View](https://sepolia.basescan.org/address/0xd702668C0E1BB35166F53965e74399f535fe32a4) |
| AaveV3Strategy *(prod-ready)* | `0x596d2b5bf237712a66A57D3aEBfbb27699407907` | [View](https://sepolia.basescan.org/address/0x596d2b5bf237712a66A57D3aEBfbb27699407907) |

> **Note:** Testnet uses `SimpleYieldStrategy` for deterministic demo behavior. `AaveV3Strategy` is deployed and production-ready — Aave V3's Base Sepolia pool doesn't currently list USDC as a reserve, but the strategy works out-of-the-box on any network where Aave supports the vault's underlying asset.

### Vault Features

```solidity
// Auto-compound: anyone can call
function harvest() external returns (uint256 profit);
function compound() external returns (uint256 profit);

// Fee management (owner only)
function setFeeRecipient(address) external;
function setPerformanceFeeBps(uint256) external; // max 30%

// On-chain transparency
uint256 public totalHarvestedProfit;
uint256 public totalFeesCollected;
uint256 public lastHarvestTimestamp;
```

---

## 🧪 Test Suite

**37/37 tests passing** covering:

| Category | Tests | Coverage |
|----------|-------|----------|
| Deployment | 9 | Constructor args, fee caps, zero-address guards |
| Deposits | 4 | ERC-4626 deposit, share minting, strategy delegation |
| Withdrawals | 3 | Redeem, partial withdraw, balance checks |
| Harvest & Compound | 8 | Profit calculation, fee deduction, reinvestment |
| Fee Configuration | 6 | Fee updates, cap enforcement, recipient changes |
| Access Control | 4 | Owner-only guards, non-owner reverts |
| Edge Cases | 3 | Zero deposits, double harvests, empty vaults |

```bash
cd contracts/evm && npx hardhat test
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Framer Motion |
| **Styling** | CSS Variables, Glassmorphism, Dark Theme |
| **Charts** | Recharts |
| **EVM Wallet** | wagmi v2, viem, RainbowKit |
| **Solana Wallet** | @solana/wallet-adapter |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin (ERC4626, Ownable, SafeERC20) |
| **Testing** | Hardhat, Chai, Ethers.js v6 |
| **Gasless TX** | Pimlico (ERC-4337 Account Abstraction) |
| **Bridging** | deBridge |
| **Analytics** | DefiLlama API, CoinGecko API, Base RPC, Solana RPC |
| **Deployment** | Vercel (frontend), Base Sepolia (contracts) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Base Sepolia wallet with testnet ETH ([faucet](https://www.base.org/faucet))

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Smart Contracts
```bash
cd contracts/evm
npm install
cp .env.example .env
# Add your PRIVATE_KEY and BASE_SEPOLIA_RPC_URL

# Run tests
npx hardhat test

# Deploy
npx hardhat run scripts/deployV2.ts --network baseSepolia
```

---

## 📁 Project Structure

```
OmniYield/
├── src/
│   ├── app/              # Next.js pages (vaults, portfolio, analytics)
│   ├── lib/
│   │   ├── hooks/        # useOmniYield, usePortfolio, useVaults, useWallet
│   │   ├── config/       # Contract addresses + ABIs
│   │   └── components/   # GaslessDeposit, WalletConnect
│   └── hooks/            # useOmniYieldAnalytics
├── contracts/
│   └── evm/
│       ├── contracts/    # Solidity source
│       │   ├── OmniYieldVault.sol
│       │   ├── interfaces/IStrategy.sol
│       │   ├── strategies/AaveV3Strategy.sol
│       │   └── strategies/SimpleYieldStrategy.sol
│       ├── test/         # 37 Hardhat tests
│       └── scripts/      # Deploy + seed scripts
└── public/               # Assets
```

---

## 📄 License

MIT
