
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x82827D1EDe2111B35ADa5A73Eccf51ebeC6eCc8f",
        "0xf6289F21AA7e846427DF34123df0609EB075B027",
        "0xAAEF528E6f7f27403fC8F23599497868917904Cc",
        "0x676DC9f1E407D58f0452a07b62d2234b4354a4CE",
        "0x518bcf12A4A9d4265758fcbb85FEF48d538D9635",
        "0x1A4D870a8686557567aC71A1E96ACd2c868e4Ffa",
        "0x9E5BB1ec82175FBE2900091014D7F06dC67d9047",
        "0x8AcA380a31e9e981b1b00c306bc4cbAeB83A5CA8",
        "0xad6cfe4599e114F2ae27F8fc104E496b0b30dD71"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new();

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};