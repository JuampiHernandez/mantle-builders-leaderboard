# 🚀 BuilderRewards Deployment Guide

Complete step-by-step guide to deploy and test the reward distribution contract on Mantle.

---

## 📊 How Distribution Works

The contract distributes **whatever ETH is in it** based on these percentages:

| Rank | Percentage | If 0.00001 ETH | If 10 ETH |
|------|------------|----------------|-----------|
| 1st  | 25%        | 0.0000025 ETH  | 2.5 ETH   |
| 2nd  | 18%        | 0.0000018 ETH  | 1.8 ETH   |
| 3rd  | 14%        | 0.0000014 ETH  | 1.4 ETH   |
| 4th  | 11%        | 0.0000011 ETH  | 1.1 ETH   |
| 5th  | 9%         | 0.0000009 ETH  | 0.9 ETH   |
| 6th  | 7%         | 0.0000007 ETH  | 0.7 ETH   |
| 7th  | 6%         | 0.0000006 ETH  | 0.6 ETH   |
| 8th  | 5%         | 0.0000005 ETH  | 0.5 ETH   |
| 9th  | 3%         | 0.0000003 ETH  | 0.3 ETH   |
| 10th | 2%         | 0.0000002 ETH  | 0.2 ETH   |

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Create a Deployer Wallet

You need a wallet to deploy the contract. This wallet will be the **owner** and the only one who can trigger distributions.

**Option A: Use MetaMask**
1. Open MetaMask
2. Create a new account (or use existing)
3. Click the 3 dots → "Account details" → "Show private key"
4. Copy the private key (without the `0x` prefix)

**Option B: Create a fresh wallet for deployment**
1. Go to https://metamask.io and install
2. Create new wallet, save your seed phrase
3. Export private key as above

---

### Step 2: Get MNT for Gas Fees

You need MNT (Mantle's native token) to pay for gas.

**For Testnet (Mantle Sepolia) - FREE:**
1. Go to https://faucet.sepolia.mantle.xyz/
2. Enter your wallet address
3. Get free test MNT

**For Mainnet:**
1. Bridge ETH from Ethereum: https://bridge.mantle.xyz/
2. Or buy MNT on exchanges

---

### Step 3: Configure Environment Variables

Edit your `.env.local` file and add:

```env
# Your deployer wallet private key (WITHOUT 0x prefix)
DEPLOYER_PRIVATE_KEY=your_64_character_private_key_here
```

⚠️ **NEVER share your private key or commit it to git!**

---

### Step 4: Get Top 10 Builder Addresses

Run this command to fetch the top 10 builders from your leaderboard:

```bash
node scripts/get-top-builders.js
```

This will output something like:
```
📋 TOP 10 BUILDERS BY SCORE:

Rank 1: alice.eth
   Score: 850
   Wallet: 0x1234...

...

📝 COPY THIS INTO scripts/deploy.js:

const initialBuilders = [
  "0x1234...", // Rank 1
  "0x5678...", // Rank 2
  ...
];
```

Copy the `initialBuilders` array and paste it into `scripts/deploy.js`.

---

### Step 5: Deploy to Testnet First (Recommended)

Always test on Sepolia testnet before mainnet!

```bash
npx hardhat run scripts/deploy.js --network mantleSepolia
```

You'll see output like:
```
🚀 Deploying BuilderRewards contract to Mantle...

📍 Deploying with account: 0xYourAddress
💰 Account balance: 0.5 MNT

✅ BuilderRewards deployed successfully!
📍 Contract address: 0xContractAddress

🔗 View on Mantlescan:
   https://sepolia.mantlescan.xyz/address/0xContractAddress
```

**Save the contract address!**

---

### Step 6: Test the Contract

#### 6a. Update your `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
```

#### 6b. Send test ETH to the contract:

Using MetaMask:
1. Open MetaMask
2. Click "Send"
3. Paste the contract address
4. Enter amount: `0.00001` ETH
5. Confirm transaction

#### 6c. Test distribution:

1. Start your website: `npm run dev`
2. Open http://localhost:3000
3. Click "Distribute Rewards" button
4. Connect your deployer wallet
5. Click "Distribute"
6. Check Mantlescan to verify the transactions

---

### Step 7: Deploy to Mainnet

Once testing is successful:

```bash
npx hardhat run scripts/deploy.js --network mantle
```

Update `.env.local` with the mainnet contract address:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xMainnetContractAddress
```

---

### Step 8: Fund and Distribute

1. Send ETH to the mainnet contract address
2. Click "Distribute Rewards" on your website
3. Confirm the transaction
4. 🎉 Rewards distributed!

---

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npx hardhat compile` | Compile the contract |
| `npx hardhat run scripts/deploy.js --network mantleSepolia` | Deploy to testnet |
| `npx hardhat run scripts/deploy.js --network mantle` | Deploy to mainnet |
| `node scripts/get-top-builders.js` | Get top 10 builder addresses |

---

## 🌐 Network Details

### Mantle Mainnet
- Chain ID: 5000
- RPC: https://rpc.mantle.xyz
- Explorer: https://mantlescan.xyz
- Currency: MNT

### Mantle Sepolia (Testnet)
- Chain ID: 5003
- RPC: https://rpc.sepolia.mantle.xyz
- Explorer: https://sepolia.mantlescan.xyz
- Faucet: https://faucet.sepolia.mantle.xyz/

---

## ❓ Troubleshooting

### "Insufficient funds for gas"
- Make sure you have MNT in your deployer wallet
- For testnet, use the faucet

### "Only owner can call this function"
- You must be connected with the same wallet that deployed the contract

### "No funds to distribute"
- Send ETH to the contract first before distributing

### Contract not showing on website
- Make sure `NEXT_PUBLIC_CONTRACT_ADDRESS` is set in `.env.local`
- Restart your dev server after changing env variables

---

## 🔐 Security Checklist

- [ ] Private key is NOT committed to git
- [ ] Private key is in `.env.local` (which is gitignored)
- [ ] Tested on Sepolia testnet first
- [ ] Verified all 10 builder addresses are correct
- [ ] Deployer wallet is secured (seed phrase backed up)
