
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });


  it(`Check if the first airline is registered automatically`, async function () {
    let result = await config.flightSuretyApp.isAirline.call(config.firstAirline);
    assert.equal(result, true, "Airline should be registered");
  });


  it(`(multiparty) Has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });


  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyApp.setOperatingStatus(false, { from: config.testAddresses[2] });
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });


  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyApp.setOperatingStatus(false);
    }
    catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
  });


  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyApp.setOperatingStatus(false);

    // Get operating status
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, false, "Incorrect operating status value");

    let reverted = false;
    try {
      await config.flightSuretyApp.buyInsurance();
    }
    catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");
    await config.flightSuretyApp.setOperatingStatus(true);
  });


  it('(airline) cannot register another Airline if itself is not funded', async () => {
    // Airline Ante: Airline can be registered, but does not participate in contract until it submits funding of 10 ether

    // ARRANGE
    let airlineRegsiteredButNotFunded = accounts[2];
    let newAirline = accounts[6];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, { from: airlineRegsiteredButNotFunded });
    }
    catch (e) {
      assert.isTrue(true, "revert exception required");
    }
    let result = await config.flightSuretyApp.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

});
