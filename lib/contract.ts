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

// Mantle Network configuration
export const MANTLE_CHAIN = {
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
  name: "Mantle Sepolia",
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

// Distribution percentages for display
export const DISTRIBUTION_PERCENTAGES = [
  { rank: 1, percentage: 25, label: "2.5 ETH" },
  { rank: 2, percentage: 18, label: "1.8 ETH" },
  { rank: 3, percentage: 14, label: "1.4 ETH" },
  { rank: 4, percentage: 11, label: "1.1 ETH" },
  { rank: 5, percentage: 9, label: "0.9 ETH" },
  { rank: 6, percentage: 7, label: "0.7 ETH" },
  { rank: 7, percentage: 6, label: "0.6 ETH" },
  { rank: 8, percentage: 5, label: "0.5 ETH" },
  { rank: 9, percentage: 3, label: "0.3 ETH" },
  { rank: 10, percentage: 2, label: "0.2 ETH" },
];
