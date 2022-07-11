// var HDWalletProvider = require("truffle-hdwallet-provider");
// var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker"); // to fix error 'the tx doesn't have the correct nonce'

// var mnemonic = "extra minor eyebrow ice rail peasant slim common upgrade spell armor core";

module.exports = {
  networks: {
    development: {
      /*provider: function() {
        var wallet = new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
        var nonceTracker = new NonceTrackerSubprovider();
        wallet.engine._providers.unshift(nonceTracker);
        nonceTracker.setEngine(wallet.engine);
        return wallet; 
      },
      */
     // use no wallet provider to fix error 'the tx doesn't have the correct nonce'
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
      //gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};