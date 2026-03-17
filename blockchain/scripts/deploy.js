// scripts/deploy.js
// This script deploys AND immediately verifies using the exact same compiler session.
// Always use this script instead of deploying and verifying separately.

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // 1. Compile fresh — guarantees bytecode matches what we deploy
  await hre.run("compile", { force: true });
  console.log("Compiled successfully\n");

  // 2. Deploy
  const Registry = await hre.ethers.getContractFactory("CivicComplaintRegistry");
  const contract  = await Registry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("✅ Deployed to:", address);
  console.log("   Tx hash:    ", deployTx.hash);
  console.log("   Network:    ", hre.network.name);

  console.log("\n──────────────────────────────────────────");
  console.log("Add to backend/.env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log("──────────────────────────────────────────");

  // 3. Verify — only on live networks
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\nSkipping verification on local network.");
    return;
  }

  if (!process.env.API_KEY) {
    console.log("\n⚠️  API_KEY not set — skipping verification.");
    console.log(`   Run later: npx hardhat verify --network sepolia ${address}`);
    return;
  }

  console.log("\nWaiting 6 block confirmations before verifying...");
  await deployTx.wait(6);
  console.log("6 confirmations reached\n");

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("✅ Verified on Etherscan!");
    console.log(`   https://sepolia.etherscan.io/address/${address}#code`);
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("✅ Already verified.");
    } else {
      console.error("⚠️  Verification error:", e.message);
      console.log(`\nRetry: npx hardhat verify --network sepolia ${address}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
