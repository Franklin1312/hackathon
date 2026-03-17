// scripts/verify.js
// Use this ONLY if you already deployed and need to verify separately.
// The bytecode mismatch issue is fixed by clearing cache before verifying.

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function clearCache() {
  const cacheDir    = path.join(__dirname, "../cache");
  const artifactDir = path.join(__dirname, "../artifacts");
  if (fs.existsSync(cacheDir))    fs.rmSync(cacheDir,    { recursive: true });
  if (fs.existsSync(artifactDir)) fs.rmSync(artifactDir, { recursive: true });
  console.log("Cache cleared");
}

async function main() {
  const address = process.env.CONTRACT_ADDRESS || process.argv[2];

  if (!address) {
    throw new Error(
      "Provide the contract address:\n" +
      "  node scripts/verify.js 0xYourAddress\n" +
      "  OR set CONTRACT_ADDRESS in .env"
    );
  }

  console.log("Contract address:", address);
  console.log("Network:         ", hre.network.name);

  // Clear cache then recompile — ensures bytecode is freshly generated
  await clearCache();
  await hre.run("compile", { force: true });
  console.log("Recompiled fresh\n");

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("\n✅ Verified successfully!");
    console.log(`https://sepolia.etherscan.io/address/${address}#code`);
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("✅ Already verified.");
      console.log(`https://sepolia.etherscan.io/address/${address}#code`);
    } else {
      console.error("\n❌ Verification failed:", e.message);
      console.log("\nTroubleshooting:");
      console.log("1. The contract was deployed with DIFFERENT compiler settings.");
      console.log("   → Redeploy using: npx hardhat run scripts/deploy.js --network sepolia");
      console.log("2. The contract address is wrong or on the wrong network.");
      console.log("3. Check https://sepolia.etherscan.io/address/" + address);
    }
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
