pragma solidity ^0.8.28;

contract SimpleWallet {
    address public owner;

event Deposit(address indexed from, uint amount);
event Withdraw(address indexed to, uint amount);
    constructor(){
        owner = msg.sender;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(address payable _to, uint _amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(address(this).balance >= _amount, "Insufficient balance");
        

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Transfer failed");
        emit Withdraw(_to, _amount);
    }

    function balance() external view returns (uint) {
        return address(this).balance;
    }   
}