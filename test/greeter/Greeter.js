import { shouldBehaveLikeGreeter } from "./Greeter.behavior";
import { deployGreeterFixture } from "./Greeter.fixture";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {};

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];

    this.loadFixture = loadFixture;
  });

  describe("Greeter", function () {
    beforeEach(async function () {
      const { greeter } = await this.loadFixture(deployGreeterFixture);
      this.greeter = greeter;
    });

    shouldBehaveLikeGreeter();
  });
});
