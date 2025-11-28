const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "CORE");

    const PiP = await ethers.getContractFactory("PiP");
    const pip = await PiP.deploy(ethers.parseEther("1000000"));

    await pip.waitForDeployment();
    const address = await pip.getAddress();
    
    console.log("Points in Play (PiP) deployed to:", address);
    console.log("Initial supply: 1,000,000 PiP");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
