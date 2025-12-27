import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleWallet", function () {
  it("Should deploy and allow deposits and withdrawals", async function () {
    console.log("Signer1 address:", signer1.address);
    console.log("Signer2 address:", signer2.address);

    const WalletFactory = await ethers.getContractFactory("SimpleWallet");

    const wallet1 = await WalletFactory.connect(signer1).deploy();
    await wallet1.waitForDeployment();

    const wallet1Address = await wallet1.getAddress();
    console.log("Wallet deployed at:", wallet1Address);
    console.log("Wallet1 owner:", await wallet1.owner());

    const wallet2 = await WalletFactory.connect(signer2).deploy();
    await wallet2.waitForDeployment();

    const wallet2Address = await wallet2.getAddress();
    console.log("Wallet2 deployed at:", wallet2Address);
    console.log("Wallet2 owner:", await wallet2.owner());

    const depositAmount = ethers.parseEther("1.0");

    await signer1.sendTransaction({
      to: wallet1Address,
      value: depositAmount,
    });

    await signer1.sendTransaction({
      to: wallet2Address,
      value: depositAmount,
    });

    const signer1Balance = await ethers.provider.getBalance(signer1.address);

    console.log(
      "Signer1 balance before transfer:",
      ethers.formatEther(signer1Balance),
      "ETH"
    );

    console.log(
      "Wallet1 balance after transfer:",
      ethers.formatEther(await wallet1.balance()),
      "ETH"
    );
    console.log(
      "Wallet2 balance after transfer:",
      ethers.formatEther(await wallet2.balance()),
      "ETH"
    );

    expect(await wallet1.balance()).to.equal(ethers.parseEther("1.0"));
    expect(await wallet2.balance()).to.equal(ethers.parseEther("1.0"));
  });
});
