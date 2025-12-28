// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Wallet {
    address public owner;

    constructor(){
        owner = msg.sender;
    }

    receive() external payable{
        require(msg.value > 0, "ETH is require");
    }

    function withdraw(address receiver, uint256 amount) external {
        require(msg.sender == owner, "Withdraw is allowed by only from owner");
        require(address(this).balance >= amount, "Insufficient ETH");

        (bool success, ) = receiver.call{value: amount}("");
        require(success, "ETH transfer failed");
        

    }

    function getBalance() external view returns (uint256){
        return address(this).balance;
    }
}