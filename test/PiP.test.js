const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PiP (Points in Play)", function () {
    let pip;
    let owner;
    let addr1;
    let addr2;
    const initialSupply = ethers.parseEther("1000000");

    beforeEach(async function () {
        console.log("\n    [SETUP] Preparing test environment...");
        
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log(`    [SETUP] Owner address: ${owner.address}`);
        console.log(`    [SETUP] Addr1 address: ${addr1.address}`);
        console.log(`    [SETUP] Addr2 address: ${addr2.address}`);
        
        const PiP = await ethers.getContractFactory("PiP");
        console.log("    [SETUP] Deploying PiP contract...");
        
        pip = await PiP.deploy(initialSupply);
        const address = await pip.getAddress();
        console.log(`    [SETUP] Contract deployed at: ${address}`);
        console.log(`    [SETUP] Initial supply: ${ethers.formatEther(initialSupply)} PiP\n`);
    });

    describe("Deployment", function () {
        it("Should have correct name and symbol", async function () {
            console.log("    [TEST] Checking token name and symbol");
            
            const name = await pip.name();
            const symbol = await pip.symbol();
            
            console.log(`    [INFO] Token name: "${name}"`);
            console.log(`    [INFO] Token symbol: "${symbol}"`);
            
            expect(name).to.equal("Points in Play");
            expect(symbol).to.equal("PiP");
            
            console.log("    [PASS] Name and symbol are correct!\n");
        });

        it("Should assign the total supply to the owner", async function () {
            console.log("    [TEST] Checking that all tokens belong to owner");
            
            const ownerBalance = await pip.balanceOf(owner.address);
            
            console.log(`    [INFO] Owner balance: ${ethers.formatEther(ownerBalance)} PiP`);
            console.log(`    [INFO] Expected balance: ${ethers.formatEther(initialSupply)} PiP`);
            
            expect(ownerBalance).to.equal(initialSupply);
            
            console.log("    [PASS] All tokens assigned to owner!\n");
        });

        it("Should set the right owner", async function () {
            console.log("    [TEST] Checking contract owner");
            
            const contractOwner = await pip.owner();
            
            console.log(`    [INFO] Contract owner: ${contractOwner}`);
            console.log(`    [INFO] Expected owner: ${owner.address}`);
            
            expect(contractOwner).to.equal(owner.address);
            
            console.log("    [PASS] Owner is set correctly!\n");
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            console.log("    [TEST] Testing token transfers between accounts");
            const amount = ethers.parseEther("100");
            
            console.log(`\n    [ACTION] Owner transfers ${ethers.formatEther(amount)} PiP to Addr1`);
            await pip.transfer(addr1.address, amount);
            
            const addr1Balance = await pip.balanceOf(addr1.address);
            console.log(`    [INFO] Addr1 balance after transfer: ${ethers.formatEther(addr1Balance)} PiP`);
            expect(addr1Balance).to.equal(amount);

            console.log(`\n    [ACTION] Addr1 transfers ${ethers.formatEther(amount)} PiP to Addr2`);
            await pip.connect(addr1).transfer(addr2.address, amount);
            
            const addr1BalanceAfter = await pip.balanceOf(addr1.address);
            const addr2Balance = await pip.balanceOf(addr2.address);
            
            console.log(`    [INFO] Addr1 balance: ${ethers.formatEther(addr1BalanceAfter)} PiP`);
            console.log(`    [INFO] Addr2 balance: ${ethers.formatEther(addr2Balance)} PiP`);
            
            expect(addr2Balance).to.equal(amount);
            expect(addr1BalanceAfter).to.equal(0);
            
            console.log("    [PASS] Transfers work correctly!\n");
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            console.log("    [TEST] Testing transfer with insufficient balance");
            const amount = ethers.parseEther("100");
            
            const addr1Balance = await pip.balanceOf(addr1.address);
            console.log(`    [INFO] Addr1 balance: ${ethers.formatEther(addr1Balance)} PiP`);
            console.log(`    [ACTION] Addr1 attempts to transfer: ${ethers.formatEther(amount)} PiP`);
            console.log("    [WARNING] Balance is less than transfer amount!");
            
            await expect(
                pip.connect(addr1).transfer(owner.address, amount)
            ).to.be.revertedWithCustomError(pip, "ERC20InsufficientBalance");
            
            console.log("    [PASS] Transaction rejected: ERC20InsufficientBalance\n");
        });

        it("Should fail if non-owner tries to transfer someone else's tokens", async function () {
            console.log("    [TEST] Testing unauthorized transfer attempt");
            const amount = ethers.parseEther("100");
            
            const ownerBalance = await pip.balanceOf(owner.address);
            console.log(`    [INFO] Owner balance: ${ethers.formatEther(ownerBalance)} PiP`);
            console.log(`    [ACTION] Addr1 attempts to transfer Owner's tokens to Addr2`);
            console.log(`    [ACTION] Amount: ${ethers.formatEther(amount)} PiP`);
            console.log("    [WARNING] Addr1 does NOT have allowance from Owner!");
            
            await expect(
                pip.connect(addr1).transferFrom(owner.address, addr2.address, amount)
            ).to.be.revertedWithCustomError(pip, "ERC20InsufficientAllowance");
            
            console.log("    [PASS] Transaction rejected: ERC20InsufficientAllowance");
            console.log("    [PASS] Tokens are protected!\n");
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint new tokens", async function () {
            console.log("    [TEST] Testing minting by owner");
            const mintAmount = ethers.parseEther("500");
            
            const totalSupplyBefore = await pip.totalSupply();
            console.log(`    [INFO] Total supply before mint: ${ethers.formatEther(totalSupplyBefore)} PiP`);
            
            console.log(`    [ACTION] Owner mints ${ethers.formatEther(mintAmount)} PiP to Addr1`);
            await pip.mint(addr1.address, mintAmount);
            
            const addr1Balance = await pip.balanceOf(addr1.address);
            const totalSupplyAfter = await pip.totalSupply();
            
            console.log(`    [INFO] Addr1 balance: ${ethers.formatEther(addr1Balance)} PiP`);
            console.log(`    [INFO] Total supply after mint: ${ethers.formatEther(totalSupplyAfter)} PiP`);
            
            expect(addr1Balance).to.equal(mintAmount);
            
            console.log("    [PASS] Minting successful!\n");
        });

        it("Should fail if non-owner tries to mint", async function () {
            console.log("    [TEST] Testing minting by non-owner");
            const mintAmount = ethers.parseEther("500");
            
            console.log(`    [ACTION] Addr1 attempts to mint ${ethers.formatEther(mintAmount)} PiP`);
            console.log("    [WARNING] Addr1 is NOT the contract owner!");
            
            await expect(
                pip.connect(addr1).mint(addr1.address, mintAmount)
            ).to.be.revertedWithCustomError(pip, "OwnableUnauthorizedAccount");
            
            console.log("    [PASS] Transaction rejected: OwnableUnauthorizedAccount");
            console.log("    [PASS] Only owner can mint!\n");
        });
    });

    describe("Balance checks", function () {
        it("Should return correct balance after multiple transfers", async function () {
            console.log("    [TEST] Checking balances after multiple transfers");
            
            const ownerBalanceBefore = await pip.balanceOf(owner.address);
            console.log(`\n    [INFO] Initial owner balance: ${ethers.formatEther(ownerBalanceBefore)} PiP`);
            
            console.log(`    [ACTION] Owner transfers 1000 PiP to Addr1`);
            await pip.transfer(addr1.address, ethers.parseEther("1000"));
            
            console.log(`    [ACTION] Owner transfers 500 PiP to Addr2`);
            await pip.transfer(addr2.address, ethers.parseEther("500"));
            
            const ownerBalance = await pip.balanceOf(owner.address);
            const addr1Balance = await pip.balanceOf(addr1.address);
            const addr2Balance = await pip.balanceOf(addr2.address);
            
            console.log(`\n    [INFO] Final balances:`);
            console.log(`    [INFO] Owner: ${ethers.formatEther(ownerBalance)} PiP (was 1,000,000 - 1,000 - 500 = 998,500)`);
            console.log(`    [INFO] Addr1: ${ethers.formatEther(addr1Balance)} PiP`);
            console.log(`    [INFO] Addr2: ${ethers.formatEther(addr2Balance)} PiP`);
            
            expect(ownerBalance).to.equal(ethers.parseEther("998500"));
            expect(addr1Balance).to.equal(ethers.parseEther("1000"));
            expect(addr2Balance).to.equal(ethers.parseEther("500"));
            
            console.log("    [PASS] All balances are correct!\n");
        });
    });
});
