// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Transaction {
    address to;
    uint256 value;
    bool executed;
    uint256 approvals;
}

contract MultiSigWallet {
    address[] public owners;
    uint256 public required;
    mapping (address => bool) public isOwner;
    Transaction[] public transactions;
    mapping (uint256 => mapping(address => bool)) public approved;

    receive() external payable {}

    modifier onlyOwner(){
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _required){
        require(_owners.length > 0, "Owners are required");
        require(_owners.length >= _required, "Owners count should be more or equal than required amount");
        for (uint256 i = 0; i < _owners.length; i++){
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            
            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    function submitTransaction(address _to, uint256 _value) external onlyOwner {
        transactions.push(Transaction({
            to: _to,
            value: _value,
            executed: false,
            approvals: 0
        }));
    }

    function executeTransaction(uint256 _txId) external onlyOwner {
        Transaction storage txToExecute = transactions[_txId];
        require(txToExecute.approvals >= required, "Approvals are less than required amount");
        require(txToExecute.executed == false, "Tx is already executed");
        txToExecute.executed = true;
        (bool success, ) = txToExecute.to.call{value: txToExecute.value}("");
        require(success, "Transaction failed");
    }
 
    function approveTransaction(uint256 _txId) external onlyOwner {
        Transaction storage txToApprove = transactions[_txId];
        require(txToApprove.executed == false, "Tx is already executed");
        require(approved[_txId][msg.sender] == false, "Tx is already approved by this address");
        approved[_txId][msg.sender] = true;
        txToApprove.approvals += 1;
    }
}