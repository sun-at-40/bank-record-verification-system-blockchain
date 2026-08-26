// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BankRecordRegistry
 * @dev Stores cryptographic hashes of off-chain bank records to ensure data integrity.
 * This approach (hash anchoring) minimizes on-chain storage costs while providing
 * immutable proof that a record existed in a specific state at a specific time.
 */
contract BankRecordRegistry is Ownable {
    
    struct RecordEntry {
        bytes32 recordHash;
        uint256 timestamp;
        address submittedBy;
    }

    // Mapping from recordId (e.g., UUID or DB ID) to its history of updates
    mapping(string => RecordEntry[]) private _recordHistory;

    // Events for off-chain indexing and audit trails
    event RecordAdded(
        string indexed recordId,
        bytes32 recordHash,
        uint256 timestamp,
        address indexed submittedBy
    );
    
    /**
     * @dev Constructor sets the deployer as the initial owner.
     * OpenZeppelin Ownable takes msg.sender as the initial owner in ^5.0.0.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Adds a new record hash or updates an existing record (by appending to history).
     * @param recordId The unique identifier of the record from the off-chain DB.
     * @param recordHash The SHA-256 hash of the record data.
     */
    function addRecord(string memory recordId, bytes32 recordHash) external onlyOwner {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        
        RecordEntry memory newEntry = RecordEntry({
            recordHash: recordHash,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        _recordHistory[recordId].push(newEntry);

        emit RecordAdded(recordId, recordHash, block.timestamp, msg.sender);
    }

    /**
     * @dev Verifies if the provided hash matches the latest anchored hash for the record.
     * @param recordId The unique identifier of the record.
     * @param hashToCheck The hash computed from the current off-chain data.
     * @return bool True if the hash matches the latest on-chain record, false otherwise.
     */
    function verifyRecord(string memory recordId, bytes32 hashToCheck) external view returns (bool) {
        require(_recordHistory[recordId].length > 0, "Record does not exist");
        
        uint256 latestIndex = _recordHistory[recordId].length - 1;
        return _recordHistory[recordId][latestIndex].recordHash == hashToCheck;
    }

    /**
     * @dev Fetches the complete history of hashes for a given record.
     * @param recordId The unique identifier of the record.
     * @return RecordEntry[] The array of historical entries for the record.
     */
    function getRecordHistory(string memory recordId) external view returns (RecordEntry[] memory) {
        return _recordHistory[recordId];
    }
}
