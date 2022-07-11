import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const GAS_LIMIT = 3000000;
const STATUS_CODES = [0, 10, 20, 30, 40, 50];

const oracles = [];

// Oracle Initialization:
// Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory
// use flightSuretyApp.registerOracle
async function initialization() {
  let accounts = await web3.eth.getAccounts();
  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  for (let a = 0; a < 20; a++) {
    flightSuretyApp.methods.registerOracle().send({ from: accounts[a], value: fee, gas: GAS_LIMIT })
      .catch((error) => console.log(`Error: ${error}`))
      .then((result) => {
        flightSuretyApp.methods.getMyIndexes().call({ from: accounts[a] })
          .catch((error) => console.log(`Error: ${error}`))
          .then((indexes) => {
            const oracle = { address: accounts[a], indexes: indexes };
            oracles.push(oracle);
            console.log("Oracle Registered: " + JSON.stringify(oracle));
          });
      });
  }
}
initialization();

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  console.log("OracleRequest: ")
  if (error) console.log("error: " + error)

  const { returnValues } = event;
  if (!returnValues) {
    return console.log(`No return value in event`);
  }
  
  // Update State, Oracle Answer (flight is late or not) by push transaction to flight contract
  const statusCodeRandom = STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
  let index = returnValues.index;
  oracles.forEach(oracle => {
    if (oracle.indexes.includes(index)) {
      flightSuretyApp.methods.submitOracleResponse(index, returnValues.airline, returnValues.flight,
        returnValues.timestamp, statusCodeRandom)
        .send({ from: oracle.address, gas: 3000000 })
        .catch((error) => console.log(`Error: ${error}`))
        .then((result) => {
          console.log("Answer from Oracle " + JSON.stringify(oracle) + " with status code: " + statusCodeRandom);
        });
    }
  });

});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
  // possible endpoint for persisting flights (for flight dropdown in ui), not needed for project requirements
})

export default app;


