import hardhat from "hardhat";

async function main() {
  const BankRecordRegistry = await hardhat.ethers.getContractFactory("BankRecordRegistry");
  const registry = await BankRecordRegistry.deploy();

  await registry.waitForDeployment();

  console.log(`BankRecordRegistry deployed to: ${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
