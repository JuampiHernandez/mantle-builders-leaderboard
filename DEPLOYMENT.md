# BuilderRewards Smart Contract - Deployment Guide

This guide explains how to deploy the BuilderRewards smart contract on Mantle Network.

## Overview

The BuilderRewards contract allows you to:
- Receive ETH deposits
- Distribute ETH to the top 10 builders based on a weighted scale
- Update the list of top builders

### Distribution Scale (for 10 ETH total)
| Rank | Percentage | Amount |
|------|------------|--------|
| 1st  | 25%        | 2.5 ETH |
| 2nd  | 18%        | 1.8 ETH |
| 3rd  | 14%        | 1.4 ETH |
| 4th  | 11%        | 1.1 ETH |
| 5th  | 9%         | 0.9 ETH |
| 6th  | 7%         | 0.7 ETH |
| 7th  | 6%         | 0.6 ETH |
| 8th  | 5%         | 0.5 ETH |
| 9th  | 3%         | 0.3 ETH |
| 10th | 2%         | 0.2 ETH |

## Prerequisites

1. **Node.js** (v18 or higher)
2. **A wallet with MNT** (Mantle's native token for gas fees)
3. **Private key** for deployment

## Step 1: Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
```

## Step 2: Create Your Private Key

⚠️ **IMPORTANT: You must create your own private key. Never share it with anyone!**

### Option A: Using MetaMask
1. Open MetaMask
2. Click on the three dots menu → Account Details
3. Click "Show Private Key"
4. Enter your password
5. Copy the private key

### Option B: Create a New Wallet
1. Go to [MetaMask](https://metamask.io/) and create a new wallet
2. **Write down your seed phrase** and store it safely
3. Export the private key as shown above

### Option C: Using Hardhat (for development only)
```bash
npx hardhat node
# This will generate test accounts with private keys
```

## Step 3: Configure Environment Variables

Create or update your `.env.local` file:

```env
# Your deployer wallet private key (WITHOUT 0x prefix)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# After deployment, add the contract address
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Optional: For contract verification
MANTLESCAN_API_KEY=your_api_key_here
```

## Step 4: Get MNT for Gas Fees

### For Mainnet:
- Bridge ETH from Ethereum to Mantle using [Mantle Bridge](https://bridge.mantle.xyz/)
- Or buy MNT on exchanges

### For Testnet (Mantle Sepolia):
- Get test MNT from [Mantle Faucet](https://faucet.sepolia.mantle.xyz/)

## Step 5: Update Builder Addresses

Edit `scripts/deploy.ts` and update the `initialBuilders` array with the actual wallet addresses of your top 10 builders:

```typescript
const initialBuilders = [
  "0x...", // Rank 1
  "0x...", // Rank 2
  // ... etc
];
```

## Step 6: Deploy the Contract

### Deploy to Mantle Testnet (Recommended First)
```bash
npx hardhat run scripts/deploy.ts --network mantleSepolia
```

### Deploy to Mantle Mainnet
```bash
npx hardhat run scripts/deploy.ts --network mantle
```

## Step 7: Update Frontend Configuration

After deployment, update your `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_deployed_contract_address
```

## Step 8: Verify the Contract (Optional)

```bash
npx hardhat verify --network mantle CONTRACT_ADDRESS "BUILDER1_ADDRESS" "BUILDER2_ADDRESS" ... "BUILDER10_ADDRESS"
```

## Using the Contract

### Send ETH to the Contract
Simply send ETH to the contract address using any wallet.

### Distribute Rewards (Owner Only)
1. Click the "Distribute Rewards" button on the website
2. Connect your wallet (must be the owner wallet)
3. Confirm the transaction

### Update Top Builders (Owner Only)
Call `updateTopBuilders()` with the new array of 10 addresses.

## Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `receive()` | Public | Receive ETH deposits |
| `distributeRewards()` | Owner | Distribute all ETH to builders |
| `updateTopBuilders(address[10])` | Owner | Update builder addresses |
| `getBalance()` | Public | Get contract ETH balance |
| `getTopBuilders()` | Public | Get current builder addresses |
| `getDistributionAmounts()` | Public | Preview distribution amounts |
| `emergencyWithdraw()` | Owner | Withdraw all funds (emergency) |
| `transferOwnership(address)` | Owner | Transfer contract ownership |

## Security Considerations

1. **Never share your private key**
2. **Test on testnet first** before deploying to mainnet
3. **Verify builder addresses** before deployment
4. **Keep your owner wallet secure** - it controls the contract
5. **Consider using a multisig** for production deployments

## Mantle Network Details

### Mainnet
- Chain ID: 5000
- RPC: https://rpc.mantle.xyz
- Explorer: https://mantlescan.xyz

### Sepolia Testnet
- Chain ID: 5003
- RPC: https://rpc.sepolia.mantle.xyz
- Explorer: https://sepolia.mantlescan.xyz

## Troubleshooting

### "Insufficient funds"
- Make sure you have enough MNT for gas fees
- Check your wallet balance on Mantlescan

### "Only owner can call this function"
- Make sure you're connected with the wallet that deployed the contract

### Transaction stuck
- Try increasing gas price
- Check network status on Mantlescan

## Support

- [Mantle Documentation](https://docs.mantle.xyz)
- [Mantle Discord](https://discord.gg/mantle)
