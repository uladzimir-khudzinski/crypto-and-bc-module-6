require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    coreTestnet: {
      url: process.env.CORE_TESTNET_RPC_URL,
      accounts: [process.env.CORE_TESTNET_PRIVATE_KEY],
      chainId: 1114
    }
  }
};
