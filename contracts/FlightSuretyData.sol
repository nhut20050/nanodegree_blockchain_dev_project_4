pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct AirlineStatus {
        bool isRegistered;
        bool isFunded;
    }

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => AirlineStatus) airlineStatus;
    uint256 registeredAirlineCount;
    mapping(address => uint256) airlineVotes; // Number of Votes for an airline that is should be registered

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        address[] passenger;
        mapping(address => uint256) insuranceByPassenger;
    }
    mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner(address caller) {
        require(caller == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */

    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */

    function setOperatingStatus(bool mode, address caller)
        external
        requireContractOwner(caller)
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(
        address newAirlineAddress,
        address registererAddress
    ) external requireIsOperational {
        require(
            registererAddress == contractOwner ||
                airlineStatus[registererAddress].isFunded,
            "Fund required to register new Airline"
        );

        if (registererAddress != contractOwner) {
            require(
                registeredAirlineCount <= 4,
                "first airline can only register 4 new airlines (5 in sum)"
            );
        }

        airlineStatus[newAirlineAddress].isRegistered = true;
        registeredAirlineCount++;

        if (registererAddress == contractOwner) {
            airlineStatus[newAirlineAddress].isFunded = true;
        }
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buyInsurance(
        address airline,
        string flightId,
        uint256 timestamp,
        address passenger
    ) external payable requireIsOperational {
        require(
            msg.value > 0 ether,
            "Not enough money given, need more than zero"
        );
        require(msg.value <= 1 ether, "Too much money given, max. one Ether");
        require(this.isAirlineRegistered(airline), "Airline is not registered");
        require(
            this.isFlightRegistered(airline, flightId, timestamp),
            "Flight is not registered"
        );

        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        flights[flightKey].passenger.push(passenger);
        flights[flightKey].insuranceByPassenger[passenger] += msg.value;
    }

    /**
     * @dev Withdraw insurance for a flight
     *
     */
    function withdrawInsurance(
        address airline,
        string flightId,
        uint256 timestamp,
        address passenger
    ) external payable requireIsOperational {
        require(this.isAirlineRegistered(airline), "Airline is not registered");
        require(
            this.isFlightRegistered(airline, flightId, timestamp),
            "Flight is not registered"
        );

        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        uint256 payout = flights[flightKey].insuranceByPassenger[passenger];

        require(payout > 0, "No insurance available");

        flights[flightKey].insuranceByPassenger[passenger] = 0;

        passenger.transfer(payout);
    }

    function repayPassengerForFlight(
        address airline,
        string flightId,
        uint256 timestamp
    ) external payable requireIsOperational {
        require(this.isAirlineRegistered(airline), "Airline is not registered");
        require(
            this.isFlightRegistered(airline, flightId, timestamp),
            "Flight is not registered"
        );

        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        uint256 passengerCount = flights[flightKey].passenger.length;

        for (uint256 i = 0; i < passengerCount; i++) {
            address passenger = flights[flightKey].passenger[i];
            uint256 insurance = flights[flightKey]
                .insuranceByPassenger[passenger];

            if (insurance > 0) {
                flights[flightKey].insuranceByPassenger[passenger] = 0;

                // passenger receives credit of 1.5X the amount they paid: multiply with decimal not possible, so add the half.
                uint256 payout = SafeMath.add(insurance, SafeMath.div(insurance, 2));
                passenger.transfer(payout);
            }
        }
    }

    /**
     *  @dev Credits payouts to insurees
     */
    // not needed for project requirements, solved with other function
    //function creditInsurees() external requireIsOperational {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
     // not needed for project requirements, solved with other function
    //function pay() external requireIsOperational {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
     // not needed for project requirements, solved with other function
    //function fund() public payable requireIsOperational {}

    function getFlightKey(
        address airline,
        string flightId,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flightId, timestamp));
    }

    function authorizeCaller(address callerAddress) {
        // empty because implementation not required for project.
        // Would be needed to authorize flightSuretyApp, alternative to caller parameter at setOperatingStatus.
    }

    function isAirlineRegistered(address checkAddress)
        external
        view
        returns (bool)
    {
        return airlineStatus[checkAddress].isRegistered;
    }

    function registerFlight(
        address airline,
        string flightId,
        uint256 timestamp
    ) external requireIsOperational {
        Flight memory flight;

        flight.isRegistered = true;
        flight.statusCode = 0; // for unknown (see app)
        flight.updatedTimestamp = 0; // not yet updated by oracle
        flight.airline = airline;

        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        flights[flightKey] = flight;
    }

    function isFlightRegistered(
        address airline,
        string flightId,
        uint256 timestamp
    ) external view returns (bool) {
        bytes32 flightKey = getFlightKey(airline, flightId, timestamp);

        return flights[flightKey].isRegistered;
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        //fund();
    }

    function getVotesForAirline(address airline)
        external
        view
        returns (uint256)
    {
        return airlineVotes[airline];
    }

    function voteForAirline(address airline, address airlineVoter) external requireIsOperational {
        require(
            airlineStatus[airlineVoter].isFunded,
            "Voter needs to pay fund"
        );

        airlineVotes[airline]++;

        if (airlineVotes[airline] > registeredAirlineCount / 2) {
            // more than 50% votes, so airline can be registered
            airlineStatus[airline].isRegistered = true;
            registeredAirlineCount++;
        }
    }

    function payFundForAirline(address airline) external payable requireIsOperational {
        require(msg.value >= 10, "Fund to low (min. 10)");
        require(
            airlineStatus[airline].isFunded == false,
            "Airline is already funded"
        );

        airlineStatus[airline].isFunded = true;
    }
}
