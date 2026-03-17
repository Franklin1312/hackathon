// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CivicComplaintRegistry {
    struct ComplaintRecord {
        string  complaintId;
        string  complaintHash;
        uint256 timestamp;
        string  status;
        bool    exists;
    }

    mapping(string => ComplaintRecord) private complaints;
    string[] private complaintIds;
    address  public  owner;

    event ComplaintRecorded(string indexed complaintId, string complaintHash, uint256 timestamp);
    event StatusUpdated(string indexed complaintId, string newStatus, uint256 updatedAt);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// Record a new verified complaint — immutable, no delete function.
    function recordComplaint(
        string memory _complaintId,
        string memory _complaintHash,
        string memory _status
    ) external onlyOwner {
        require(!complaints[_complaintId].exists, "Already recorded");
        complaints[_complaintId] = ComplaintRecord({
            complaintId:    _complaintId,
            complaintHash:  _complaintHash,
            timestamp:      block.timestamp,
            status:         _status,
            exists:         true
        });
        complaintIds.push(_complaintId);
        emit ComplaintRecorded(_complaintId, _complaintHash, block.timestamp);
    }

    /// Update status of an existing complaint — creates immutable history via events.
    function updateStatus(string memory _complaintId, string memory _newStatus) external onlyOwner {
        require(complaints[_complaintId].exists, "Complaint not found");
        complaints[_complaintId].status = _newStatus;
        emit StatusUpdated(_complaintId, _newStatus, block.timestamp);
    }

    /// Read a complaint record.
    function getComplaint(string memory _complaintId)
        external view
        returns (string memory, string memory, uint256, string memory)
    {
        require(complaints[_complaintId].exists, "Complaint not found");
        ComplaintRecord memory r = complaints[_complaintId];
        return (r.complaintId, r.complaintHash, r.timestamp, r.status);
    }

    function getTotalComplaints() external view returns (uint256) {
        return complaintIds.length;
    }
}
