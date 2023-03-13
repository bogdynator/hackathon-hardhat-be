pragma solidity ^0.8.0;

contract ExampleContract {
    function testWithRequire(uint256 y) external {
        require(y > 10, "reverted by me");
    }

    function testSimple(uint256 z) external {
        z++;
    }

    function reqSimple(uint256 z) external {
        z++;
    }

    function reqWithOwnerAndBool(bool someBool) external {}

    function reqWithOwner(string memory name) external {}
}

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    uint256 public fundsLost;

    function getTheMoney(uint256 out) external onlyOwner {
        fundsLost += out;
    }

    function giveMeYourAssets(address owner) external {
        require(owner != address(0));
    }

    function iAmTheOwner(bool condition) external onlyOwner {
        require(condition);
    }
}

contract Worker {
    uint256 public totalHours;

    function addHours(uint256 y) external {
        require(y > 10, "reverted by me");
        totalHours += y;
    }

    function leave() external {
        totalHours = 0;
    }

    function extraWork(uint256 z) external {
        require(z < 5);
        totalHours = 2 * z;
    }
}
