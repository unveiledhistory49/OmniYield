import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia.blockpi.network/v1/rpc/public";
// Default key for compilation/testing without env (do not use in prod)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
    solidity: "0.8.20",
    networks: {
        baseSepolia: {
            url: BASE_SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
        sepolia: {
            url: "https://ethereum-sepolia-rpc.publicnode.com",
            accounts: [PRIVATE_KEY],
        },
    },
};

export default config;
