
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`first airline is registered automatic`, async function () {

    let result = await config.flightSuretyApp.isAirline.call(config.firstAirline);

    // ASSERT
    assert.equal(result, true, "Airline should be registered");
  });

  it(`(multiparty) has correct initial isOperational() value`, async function () {

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
      await config.flightSuretyApp.buyInsurance(); // Any function with requireIsOperational  //setTestingMode(true);
    }
    catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work (alternative use before function)
    await config.flightSuretyApp.setOperatingStatus(true);

  });
  
  it('(airline) cannot vote for other airline that it should be registered if it hasnot paid fund', async () => {

    let airlineNotRegistered = accounts[10];
    let airlineRegisteredButNotFunded = accounts[12];

    await config.flightSuretyApp.registerAirline(airlineRegisteredButNotFunded, { from: config.firstAirline });
    let airlineIsRegistered = await config.flightSuretyApp.isAirline.call(airlineRegisteredButNotFunded);
    assert.isTrue(airlineIsRegistered, "Airline should be registered");
    
    let votesBefore = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    try {
      await config.flightSuretyApp.voteForAirline(airlineNotRegistered, { from: airlineRegisteredButNotFunded });
    }
    catch (e) {
      assert.isTrue(true, "revert exception required");
    }
    let votesAfter = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    assert.equal(votesAfter.toNumber(), votesBefore.toNumber(), "Votes incremented");

  });

  it('(multiparty) If votes for a new airline > 50% of the number of registered airlines, then the new airline is registered', async () => {
    // Multiparty Consensus: Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines

    let airlineNotRegistered = accounts[11];
    let airlineRegisteredAndFunded1 = accounts[12];
    let airlineRegisteredAndFunded2 = accounts[13];
    
    // First vote: by airline 1
    let airlineIsRegistered = await config.flightSuretyApp.isAirline.call(airlineRegisteredAndFunded1);
    assert.isTrue(airlineIsRegistered, "Airline should be registered");

    await config.flightSuretyApp.payFundForAirline({ from: airlineRegisteredAndFunded1, value: 10 });
    
    let votesBefore = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    await config.flightSuretyApp.voteForAirline(airlineNotRegistered, { from: airlineRegisteredAndFunded1 });
    let votesAfter = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    assert.equal(votesAfter.toNumber(), votesBefore.toNumber()+1, "Votes incremented");

    // Second vote: by airline 2
    await config.flightSuretyApp.registerAirline(airlineRegisteredAndFunded2, { from: config.owner });
    airlineIsRegistered = await config.flightSuretyApp.isAirline.call(airlineRegisteredAndFunded2);
    assert.isTrue(airlineIsRegistered, "Airline should be registered");
    
    votesBefore = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    await config.flightSuretyApp.voteForAirline(airlineNotRegistered, { from: airlineRegisteredAndFunded2 });
    votesAfter = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    assert.equal(votesAfter.toNumber(), votesBefore.toNumber()+1, "Votes incremented");

    // Third vote: anoter by airline 2
    votesBefore = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    await config.flightSuretyApp.voteForAirline(airlineNotRegistered, { from: airlineRegisteredAndFunded2 });
    votesAfter = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    assert.equal(votesAfter.toNumber(), votesBefore.toNumber()+1, "Votes incremented");

    // After > 50% votes the airline is registered
    airlineIsRegistered = await config.flightSuretyApp.isAirline.call(airlineNotRegistered);
    assert.isTrue(airlineIsRegistered, "Airline should be registered");
  });

  it(`(multiparty) existing airline may register a new airline until there are at least four airlines registered, so no fifth allowed`, async function () {

    let airlineNr5 = accounts[3];

    // Note: another testcase has registered airline before, so here are not all four needed to register

    // fifth
    try {
      await config.flightSuretyApp.registerAirline(airlineNr5, { from: config.firstAirline });
    }
    catch (e) {
      assert.isTrue(e.reason.includes("can only register 4"), "revert exception required");
    }

    airlineIsRegistered = await config.flightSuretyApp.isAirline.call(airlineNr5);
    assert.equal(airlineIsRegistered, false, "Airline should not be able to register fifth airline");

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

  it('(airline) cannot register an new airline using registerAirline() if itself is not registered', async () => {

    let notRegisteredAirline = accounts[7];
    let registered = await config.flightSuretyApp.isAirline(notRegisteredAirline);
    assert.isFalse(registered, "register airline should not be registered");

    let newAirline = accounts[8];
    registered = await config.flightSuretyApp.isAirline(newAirline);
    assert.isFalse(registered, "new airline should not be registered");

    try {
      await config.flightSuretyApp.registerAirline(newAirline, { from: notRegisteredAirline });
    }
    catch (e) {
      assert.isTrue(true, "revert exception required");
    }
    let result = await config.flightSuretyApp.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if itself is not registered");

  });

  it('(owner) can register an Airline using registerAirline()', async () => {

    // ARRANGE
    let newAirline = accounts[3];

    // ACT
    await config.flightSuretyApp.registerAirline(newAirline, { from: config.owner });
    let result = await config.flightSuretyApp.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, true, "Owner should be able to register another airline");

  });

  it('(passenger) can buy insurance using buyInsurance()', async () => {

    // ARRANGE
    let airline = config.flightSample.airline;
    let flightId = config.flightSample.flightId;
    let timestamp = config.flightSample.timestamp;
    let passenger = accounts[4];
    let minMoney = 1;

    // ACT
    await config.flightSuretyApp.buyInsurance(airline, flightId, timestamp, { from: passenger, value: web3.utils.toWei(minMoney.toString(), "ether") });

    // ASSERT
    assert.equal(true, true, "Should reach here because no exception is expected");

  });

  it('(passenger) can not buy insurance using buyInsurance() if too little money', async () => {

    // ARRANGE
    let airline = config.flightSample.airline;
    let flightId = config.flightSample.flightId;
    let timestamp = config.flightSample.timestamp;
    let passenger = accounts[4];
    let tooLittleMoney = 0;

    // ACT
    try {
      await config.flightSuretyApp.buyInsurance(airline, flightId, timestamp, { from: passenger, value: web3.utils.toWei(tooLittleMoney.toString(), "ether") });
      
      assert.equal(true, false, "Should not reach here because exception is expected");
    }
    catch (e) {
      // ASSERT
      assert.equal(e.reason, "Not enough money given, need more than zero", "expect exception because of money needed");
    }

  });

  it('(airline) can vote for other airline that it should be registered', async () => {

    let airlineNotRegistered = accounts[9];

    let votesBefore = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    await config.flightSuretyApp.voteForAirline(airlineNotRegistered, { from: config.firstAirline });
    let votesAfter = await config.flightSuretyApp.getVotesForAirline(airlineNotRegistered);
    assert.equal(votesAfter.toNumber(), votesBefore.toNumber()+1, "Votes not incremented");

  });

  it('(passenger) Withdraw: Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout', async () => {

    // ARRANGE
    let airline = config.flightSample.airline;
    let flightId = config.flightSample.flightId;
    let timestamp = config.flightSample.timestamp;
    let passenger = accounts[4];
    
    // ACT
    let beforeBalance = await web3.eth.getBalance(passenger);
    await config.flightSuretyApp.withdrawInsurance(airline, flightId, timestamp, { from: passenger });
    let afterBalance = await web3.eth.getBalance(passenger);

    // ASSERT
    assert.isTrue(afterBalance > beforeBalance, "Withdraw amount expected in balance");

  });

});
