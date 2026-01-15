# Top Mantle Builders

A builder recognition program and incentive platform designed to reward the most impactful developers in the Mantle ecosystem.

*Inspired by [Talent Protocol's Builder Rewards Program](https://talentprotocol.com)*

## The Problem

Blockchain ecosystems thrive when talented developers actively contribute, but identifying and rewarding these builders is challenging. Contributions are scattered across GitHub repositories, onchain activity, and ecosystem projects—making it difficult to recognize who's truly driving value.

## The Solution

Top Mantle Builders aggregates multiple data sources to create a unified **Builder Score** that ranks developers by their real impact on the Mantle ecosystem.

### Metrics Tracked

| Category | Metrics |
|----------|---------|
| **Onchain Activity** | Total transactions, weekly transactions, weekly active smart contracts, gas fees paid on Mantle |
| **GitHub Contributions** | Total commits, crypto-specific commits, Mantle ecosystem commits, repository stars, forks |
| **Ecosystem Involvement** | Contributions to Mantle-related open source projects |
| **Builder Earnings** | Historical rewards earned through the platform |

## Key Features

- **Real-time Leaderboard**: A searchable, paginated leaderboard showing builder profiles ranked by their composite score
- **Builder Profiles**: Detailed views showing each developer's GitHub projects, AI-generated summaries of their current work, and their onchain footprint
- **Ecosystem Projects Directory**: Showcases Mantle-related open source repositories with contributor information
- **Visual Analytics**: Charts displaying Mantle ecosystem contributors, onchain activity breakdowns, weekly active contracts, and builder activity timelines

## Rewards Distribution

The platform includes a deployed smart contract (`BuilderRewards.sol`) on Mantle that enables automated, transparent reward distribution to the top 10 builders.

### Distribution Breakdown

| Rank | Percentage | Amount (10,000 MNT Pool) |
|------|------------|--------------------------|
| 1st  | 25%        | 2,500 MNT |
| 2nd  | 18%        | 1,800 MNT |
| 3rd  | 14%        | 1,400 MNT |
| 4th  | 11%        | 1,100 MNT |
| 5th  | 9%         | 900 MNT |
| 6th  | 7%         | 700 MNT |
| 7th  | 6%         | 600 MNT |
| 8th  | 5%         | 500 MNT |
| 9th  | 3%         | 300 MNT |
| 10th | 2%         | 200 MNT |

## How to Be Eligible

1. **Deploy smart contracts** on Mantle mainnet
2. **Contribute** to Mantle ecosystem open source repositories

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Supabase (PostgreSQL), Talent Protocol API |
| **Smart Contracts** | Solidity 0.8.20, Hardhat, deployed on Mantle Sepolia/Mainnet |
| **Wallet Integration** | MetaMask / Web3 wallet support via ethers.js |

## Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── profiles/      # Builder profiles endpoint
│   │   ├── sync/          # Data sync from Talent Protocol
│   │   └── mantle-repos/  # Mantle ecosystem repos
│   ├── profile/[id]/      # Individual builder profile pages
│   └── page.tsx           # Main leaderboard page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── contracts/            # Solidity smart contracts
│   └── BuilderRewards.sol
├── lib/                  # Utility libraries
│   ├── contract.ts       # Contract ABI and config
│   ├── supabase.ts       # Database client and types
│   └── utils.ts          # Helper functions
└── scripts/              # Deployment scripts
    └── deploy.js         # Hardhat deployment script
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/top-mantle-builders.git
   cd top-mantle-builders
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values in `.env.local`:
   - `TALENT_API_KEY` - Your Talent Protocol API key
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `DEPLOYER_PRIVATE_KEY` - Wallet private key for contract deployment
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` - Deployed contract address

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Smart Contract Deployment

1. Ensure your `.env.local` has `DEPLOYER_PRIVATE_KEY` set
2. Fund your deployer wallet with MNT for gas
3. Deploy to Mantle Sepolia testnet:
   ```bash
   npx hardhat run scripts/deploy.js --network mantleSepolia
   ```
4. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` with the deployed address

### Data Sync

The platform syncs builder data from Talent Protocol. Trigger a manual sync:

```bash
curl -X POST "https://your-domain.com/api/sync?secret=YOUR_SYNC_SECRET"
```

Or set up automated daily syncs via Vercel Cron (configured in `vercel.json`).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TALENT_API_KEY` | Talent Protocol API key for fetching builder data | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `DEPLOYER_PRIVATE_KEY` | Private key for contract deployment | For deployment |
| `MANTLESCAN_API_KEY` | Mantlescan API key for contract verification | Optional |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed BuilderRewards contract address | Yes |
| `SYNC_SECRET` | Secret token for protected sync endpoint | Recommended |
| `GITHUB_TOKEN` | GitHub token for higher API rate limits | Optional |

## License

MIT

## Acknowledgments

- [Talent Protocol](https://talentprotocol.com) for the Builder Score infrastructure
- [Mantle Network](https://mantle.xyz) for the L2 infrastructure
- [shadcn/ui](https://ui.shadcn.com) for the component library
