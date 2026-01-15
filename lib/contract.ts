// Contract ABI for BuilderRewards
// This is the minimal ABI needed for frontend interaction
export const BUILDER_REWARDS_ABI = [
  {
    inputs: [{ internalType: "address[10]", name: "_initialBuilders", type: "address[10]" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "builder", type: "address" },
      { indexed: false, internalType: "uint256", name: "rank", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "BuilderPaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "FundsReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "totalAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "RewardsDistributed",
    type: "event",
  },
  {
    inputs: [],
    name: "distributeRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDistributionAmounts",
    outputs: [{ internalType: "uint256[10]", name: "amounts", type: "uint256[10]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTopBuilders",
    outputs: [{ internalType: "address[10]", name: "", type: "address[10]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address[10]", name: "_newBuilders", type: "address[10]" }],
    name: "updateTopBuilders",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

// Contract address - UPDATE THIS after deployment!
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

// Mantle Mainnet configuration
export const MANTLE_MAINNET = {
  id: 5000,
  name: "Mantle",
  network: "mantle",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { http: ["https://rpc.mantle.xyz"] },
    public: { http: ["https://rpc.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://mantlescan.xyz" },
  },
};

// Mantle Sepolia Testnet configuration
export const MANTLE_SEPOLIA_CHAIN = {
  id: 5003,
  name: "Mantle Sepolia Testnet",
  network: "mantle-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
    public: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://sepolia.mantlescan.xyz" },
  },
};

// USE TESTNET FOR NOW - Change to MANTLE_MAINNET when ready for production
export const MANTLE_CHAIN = MANTLE_SEPOLIA_CHAIN;

// Distribution percentages for display (based on 10,000 MNT prize pool)
export const DISTRIBUTION_PERCENTAGES = [
  { rank: 1, percentage: 25, label: "2,500 MNT" },
  { rank: 2, percentage: 18, label: "1,800 MNT" },
  { rank: 3, percentage: 14, label: "1,400 MNT" },
  { rank: 4, percentage: 11, label: "1,100 MNT" },
  { rank: 5, percentage: 9, label: "900 MNT" },
  { rank: 6, percentage: 7, label: "700 MNT" },
  { rank: 7, percentage: 6, label: "600 MNT" },
  { rank: 8, percentage: 5, label: "500 MNT" },
  { rank: 9, percentage: 3, label: "300 MNT" },
  { rank: 10, percentage: 2, label: "200 MNT" },
];
