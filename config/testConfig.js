
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
        "0xB68057D3C1E11a6672ed1C3dbE35FDB2930B04F1",
        "0x3d0239E02db781D126DfD53C1130CDbe8208e94a",
        "0x97Bf3DE2EB3560f4764e9A34ffD225aA97680bad",
        "0x69bc18ee0aa837979bdB9D12A5Ba7fE6703e2e5d",
        "0x84A957342fa5e056949002eE8F80ff792413AC50",
        "0x323bF1A901FeF964F0Ae4b14613dE83De3A4EF12"
    ];

    let owner = accounts[0];
    let firstAirline = accounts[1];
    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(FlightSuretyData.address, firstAirline);
    let flightSample = {
        airline: firstAirline,
        flightId: "Flight 01",
        timestamp: 1657534498
    };
    let obj = {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp,
        flightSample: flightSample
    };

    return obj;
}

module.exports = {
    Config: Config
};