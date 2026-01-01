import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Multi signature wallet contract", function () {
  let wallet: any;
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let address1: SignerWithAddress;
  let address2: SignerWithAddress;

  beforeEach(async function () {
    [owner1, owner2, owner3, address1, address2] = await ethers.getSigners();
    const Wallet = await ethers.getContractFactory("MultiSigWallet");
    wallet = await Wallet.deploy(
      [owner1.address, owner2.address, owner3.address],
      3
    );
  });

  it("Should submit transaction", async () => {
    const submitTx = await wallet
      .connect(owner1)
      .submitTransaction(address1, ethers.parseEther("1.0"));

    await submitTx.wait();

    const tx = await wallet.transactions(0);
    expect(tx.to).to.equal(address1.address);
    expect(tx.value).to.equal(ethers.parseEther("1.0"));
    expect(tx.executed).to.equal(false);
    expect(tx.approvals).to.equal(0);
  });

  it("Owner should approve transaction", async () => {
    const submitTx = await wallet
      .connect(owner1)
      .submitTransaction(address1, ethers.parseEther("1.0"));

    await submitTx.wait();

    const approveTransaction1 = await wallet
      .connect(owner3)
      .approveTransaction(0);

    const approveTransaction2 = await wallet
      .connect(owner2)
      .approveTransaction(0);

    await approveTransaction1.wait();
    await approveTransaction2.wait();

    const tx = await wallet.transactions(0);
    expect(tx.approvals).to.equal(2);
  });

  it("Duplicate approve should be reverted", async () => {
    const submitTx = await wallet
      .connect(owner1)
      .submitTransaction(address1, ethers.parseEther("1.0"));

    await submitTx.wait();

    const approveTransaction = await wallet
      .connect(owner3)
      .approveTransaction(0);

    await approveTransaction.wait();

    await expect(
      wallet.connect(owner3).approveTransaction(0)
    ).to.be.revertedWith("Tx is already approved by this address");
  });

  it("Tx should be successfull after required approves", async () => {
    const depositEther = await address2.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1.0"),
    });

    await depositEther.wait();

    const submitTx = await wallet
      .connect(owner1)
      .submitTransaction(address1, ethers.parseEther("1.0"));

    await submitTx.wait();

    const approveTransaction1 = await wallet
      .connect(owner1)
      .approveTransaction(0);

    const approveTransaction2 = await wallet
      .connect(owner2)
      .approveTransaction(0);

    const approveTransaction3 = await wallet
      .connect(owner3)
      .approveTransaction(0);

    await approveTransaction1.wait();
    await approveTransaction2.wait();
    await approveTransaction3.wait();

    const destinationStartBalance = await ethers.provider.getBalance(
      address1.address
    );

    const executeTx = await wallet.connect(owner1).executeTransaction(0);

    await executeTx.wait();

    const destinationEndBalance = await ethers.provider.getBalance(
      address1.address
    );

    expect(destinationEndBalance - destinationStartBalance).to.equal(
      ethers.parseEther("1.0")
    );
  });

  it("Tx should be reverted if approvals are less than required", async () => {
    const depositEther = await address2.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1.0"),
    });

    await depositEther.wait();

    await wallet
      .connect(owner1)
      .submitTransaction(address1.address, ethers.parseEther("1.0"));

    await wallet.connect(owner1).approveTransaction(0);
    await wallet.connect(owner2).approveTransaction(0);

    await expect(
      wallet.connect(owner1).executeTransaction(0)
    ).to.be.revertedWith("Approvals are less than required amount");
  });

  it("Tx should be reverted if already is executed", async () => {
    const depositEther = await address2.sendTransaction({
      to: wallet.target,
      value: ethers.parseEther("1.0"),
    });

    await depositEther.wait();

    const submitTx = await wallet
      .connect(owner1)
      .submitTransaction(address1, ethers.parseEther("1.0"));

    await submitTx.wait();

    const approveTransaction1 = await wallet
      .connect(owner1)
      .approveTransaction(0);

    const approveTransaction2 = await wallet
      .connect(owner2)
      .approveTransaction(0);

    const approveTransaction3 = await wallet
      .connect(owner3)
      .approveTransaction(0);

    await approveTransaction1.wait();
    await approveTransaction2.wait();
    await approveTransaction3.wait();

    const executeTx = await wallet.connect(owner1).executeTransaction(0);

    await executeTx.wait();

    await expect(
      wallet.connect(owner2).executeTransaction(0)
    ).to.be.revertedWith("Tx is already executed");
  });

  it("Tx should be reverted if non-owner tries to submit tx", async () => {
    await expect(
      wallet
        .connect(address2)
        .submitTransaction(address1.address, ethers.parseEther("1.0"))
    ).to.be.revertedWith("Not owner");
  });
});
