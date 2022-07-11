
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x9Ef8EC59A1321698e26e9e29A3110E415298E9C7",
        "0x0a53321f937849CCd8E7bD91f13e75fE33f8184d",
        "0xF1FB9b5f54667920Fb0F13234F0043C3EdBe0d4a",
        "0xb0324FeB79FE790C97d4f8cEa389F3e9CBDE087b",
        "0x63DA8939e662335122f7Cf2d3090c77ABFDd7aDe",
        "0x7485D1b7C6258D82E475148D828Bc5257fAf670c",
        "0xB814acBe56dF38f578929537DcE89b3bb1250296",
        "0x606bDa2AAFC467819fF3f20F48c00C409dd79E80",
        "0xB68057D3C1E11a6672ed1C3dbE35FDB2930B04F1"
    ];

    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(FlightSuretyData.address, firstAirline);

    let flightSample = {
        airline: firstAirline,
        flightId: "F1",
        timestamp: 1591128835 // 06/02/2020 @ 8:13pm (UTC)        
    };
    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp,
        flightSample: flightSample
    }
}

module.exports = {
    Config: Config
};