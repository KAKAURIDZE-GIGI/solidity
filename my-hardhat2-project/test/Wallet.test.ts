import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Wallet contract", function () {
  let wallet: any;
  let walletAddr1: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.connect(owner).deploy();
    walletAddr1 = await Wallet.connect(addr1).deploy();
    await wallet.waitForDeployment();
  });

  it("should have an owner", async function () {
    expect(await wallet.owner()).to.equal(owner.address);
  });

  it("receive from addr1 to owner", async function () {
    const initialAddr1Balance = await ethers.provider.getBalance(addr1.address);

    const tx = await addr1.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1.0"),
    });

    await tx.wait();

    const finalWalletBalance = await ethers.provider.getBalance(wallet.target);
    const finalAddr1Balance = await ethers.provider.getBalance(addr1.address);

    expect(finalWalletBalance).to.equal(ethers.parseEther("1.0"));
    expect(finalAddr1Balance).to.be.lt(initialAddr1Balance);
  });

  it("create new wallet and withdraw to addr1", async function () {
    await addr2.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1.0"),
    });

    const withdrawTx = await wallet
      .connect(owner)
      .withdraw(walletAddr1.target, ethers.parseEther("0.5"));

    await withdrawTx.wait();

    const finalWalletBalance = await ethers.provider.getBalance(wallet.target);
    const finalAddr1Balance = await ethers.provider.getBalance(
      walletAddr1.target
    );

    expect(finalWalletBalance).to.equal(ethers.parseEther("0.5"));
    expect(finalAddr1Balance).to.equal(ethers.parseEther("0.5"));
  });

  it("should return correct balance", async function () {
    await addr1.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("2.0"),
    });

    expect(await ethers.provider.getBalance(wallet.target)).to.equal(
      ethers.parseEther("2.0")
    );
  });
  it("Only owner can withdraw", async function () {
    await addr2.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1.0"),
    });

    await expect(
      wallet.connect(addr1).withdraw(addr1.address, ethers.parseEther("0.5"))
    ).to.be.revertedWith("Only owner can withdraw");
  });
});
