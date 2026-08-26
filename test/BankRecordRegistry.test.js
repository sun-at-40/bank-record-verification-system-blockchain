import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("BankRecordRegistry", function () {
  let BankRecordRegistry;
  let registry;
  let owner;
  let addr1;
  let addr2;
  
  // Dummy data for testing
  const recordId1 = "record-uuid-001";
  const recordId2 = "record-uuid-002";
  
  // SHA-256 hashes (32 bytes) represented as hex strings
  // In a real app, this would be computed by ethers.utils.sha256(ethers.utils.toUtf8Bytes("record data"))
  const hash1_v1 = ethers.keccak256(ethers.toUtf8Bytes("Record 1 Version 1"));
  const hash1_v2 = ethers.keccak256(ethers.toUtf8Bytes("Record 1 Version 2"));
  const hash2_v1 = ethers.keccak256(ethers.toUtf8Bytes("Record 2 Version 1"));
  const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("Tampered Record Data"));

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    BankRecordRegistry = await ethers.getContractFactory("BankRecordRegistry");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy our contract
    registry = await BankRecordRegistry.deploy();
    // Wait for the deployment transaction to be mined
    // await registry.waitForDeployment(); // Depending on ethers/hardhat version, this might be needed. For ethers v6 it is:
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("Adding Records", function () {
    it("Should allow owner to add a record", async function () {
      await expect(registry.addRecord(recordId1, hash1_v1))
        .to.emit(registry, "RecordAdded")
        .withArgs(recordId1, hash1_v1, (anyValue) => true, owner.address); // We ignore exact timestamp matching
        
      const history = await registry.getRecordHistory(recordId1);
      expect(history.length).to.equal(1);
      expect(history[0].recordHash).to.equal(hash1_v1);
      expect(history[0].submittedBy).to.equal(owner.address);
    });

    it("Should reject non-owners from adding a record", async function () {
      await expect(registry.connect(addr1).addRecord(recordId1, hash1_v1))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("Should allow owner to add multiple versions to the same recordId", async function () {
      await registry.addRecord(recordId1, hash1_v1);
      await registry.addRecord(recordId1, hash1_v2);
      
      const history = await registry.getRecordHistory(recordId1);
      expect(history.length).to.equal(2);
      expect(history[0].recordHash).to.equal(hash1_v1);
      expect(history[1].recordHash).to.equal(hash1_v2);
    });
    
    it("Should revert if recordId is empty", async function () {
        await expect(registry.addRecord("", hash1_v1))
          .to.be.revertedWith("Record ID cannot be empty");
    });
  });

  describe("Verifying Records", function () {
    beforeEach(async function () {
      // Add a record before verifying
      await registry.addRecord(recordId1, hash1_v1);
    });

    it("Should return true for a matching hash (valid record)", async function () {
      const isValid = await registry.verifyRecord(recordId1, hash1_v1);
      expect(isValid).to.be.true;
    });

    it("Should return false for a mismatched hash (tampered record)", async function () {
      const isValid = await registry.verifyRecord(recordId1, tamperedHash);
      expect(isValid).to.be.false;
    });

    it("Should verify against the LATEST hash version", async function () {
      // Update the record with v2
      await registry.addRecord(recordId1, hash1_v2);
      
      // Verification with v1 should now fail because it's outdated
      expect(await registry.verifyRecord(recordId1, hash1_v1)).to.be.false;
      
      // Verification with v2 should succeed
      expect(await registry.verifyRecord(recordId1, hash1_v2)).to.be.true;
    });

    it("Should revert when verifying a non-existent record", async function () {
      await expect(registry.verifyRecord("non-existent-id", hash1_v1))
        .to.be.revertedWith("Record does not exist");
    });
  });
});
