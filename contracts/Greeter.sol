pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicContract2 is Ownable {
    uint256 public a;
    uint256 public b = 5;

    function incrementA() external {
        a++;
    }

    function decrementA() external {
        a--;
    }

    function req1(uint256 a) external {
        require(a > 10, "reverted by me");
    }

    function req2(uint256 a) external onlyOwner {
        a++;
    }

    function req3(uint256 a) external {
        a++;
    }

    function req4(bool a) external onlyOwner {}

    function req5(string memory a) external onlyOwner {}
}
