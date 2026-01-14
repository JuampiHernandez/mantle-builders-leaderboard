const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying BuilderRewards contract to Mantle...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Initial top 10 builder addresses
  // Replace these with actual wallet addresses from your leaderboard
  // These are placeholder addresses - UPDATE BEFORE DEPLOYMENT!
  const initialBuilders = [
    "0x57F9a9C5b176196C713eBC5b314D34F2a769a54F", // Rank 1
    "0x53b47dce7c3e50caa47ee51031b24a85b49f1fff", // Rank 2
    "0x358e25cd4d7631eb874d25f4e1ae4a14b0abb56e", // Rank 3
    "0xc095c7cA2B56b0F0DC572d5d4A9Eb1B37f4306a0", // Rank 4
    "0x8441021bfe1B7B06cC3cB53FA71370583CF3f523", // Rank 5
    "0x432795ea5aCbC944c3df02868e0CCDC58cA98DD5", // Rank 6
    "0x4e92b60150ca2d39dd2ff41618dd4def9def1ed9", // Rank 7
    "0xBe76b786E4D9A6039B9e9F188e0ee0a955Cae5C8", // Rank 8
    "0xA0701444c0813AD0e52b69804EDF130937A7616F", // Rank 9
    "0x8513A856a88e63374286d0116C192733444894C0", // Rank 10
  ];

  console.log("📋 Initial Top 10 Builders:");
  initialBuilders.forEach((addr, i) => {
    console.log(`   Rank ${i + 1}: ${addr}`);
  });
  console.log("");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const BuilderRewards = await ethers.getContractFactory("BuilderRewards");
  const builderRewards = await BuilderRewards.deploy(initialBuilders);

  await builderRewards.waitForDeployment();
  const contractAddress = await builderRewards.getAddress();

  console.log("\n✅ BuilderRewards deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("\n🔗 View on Mantlescan:");
  console.log(`   https://mantlescan.xyz/address/${contractAddress}`);
  
  console.log("\n📝 Next steps:");
  console.log("   1. Send ETH to the contract address to fund rewards");
  console.log("   2. Update .env.local with NEXT_PUBLIC_CONTRACT_ADDRESS=" + contractAddress);
  console.log("   3. Call distributeRewards() when ready to distribute");
  
  console.log("\n💡 To verify the contract:");
  console.log(`   npx hardhat verify --network mantle ${contractAddress} "${initialBuilders.join('" "')}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
