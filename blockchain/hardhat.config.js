process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY     = process.env.PRIVATE_KEY     || "";
const API_KEY         = process.env.API_KEY         || "";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      // Try 1: Disable optimizer completely — most likely to match
      optimizer: {
        enabled: false,
      },
      evmVersion: "paris",  // Sepolia runs Paris EVM
    },
  },

  networks: {
    sepolia: {
      url:      SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId:  11155111,
    },
    localhost: {
      url:     "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },

  etherscan: {
    apiKey: API_KEY,
  },

  sourcify: {
    enabled: false,
  },
};
