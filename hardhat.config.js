require("@nomicfoundation/hardhat-toolbox");

// Get private key from environment variable
// IMPORTANT: Never commit your private key! Always use environment variables
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Mantle Mainnet
    mantle: {
      url: "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: [PRIVATE_KEY],
    },
    // Mantle Sepolia Testnet (for testing)
    mantleSepolia: {
      url: "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      mantle: process.env.MANTLESCAN_API_KEY || "",
      mantleSepolia: process.env.MANTLESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
