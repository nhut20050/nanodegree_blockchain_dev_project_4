pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract

    // Flight struct must equal the struct in contracts\FlightSuretyData.sol
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    FlightSuretyDataInterface flightSuretyData;

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
        // Modify to call data contract's status
        require(flightSuretyData.isOperational(), "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address flightSuretyDataAddress, address firstAirline) public {
        contractOwner = msg.sender;

        flightSuretyData = FlightSuretyDataInterface(flightSuretyDataAddress);

        // Requirement: First airline is registered when contract is deployed. (cannot call this.registerAirline in constructor)
        flightSuretyData.registerAirline(firstAirline, msg.sender); // keep origin sender, so it does not change to FlightSuretyApp

        // predefined Flights (so no GUI is neccessary to define)
        flightSuretyData.registerFlight(firstAirline, "F1", 1591128835); // 06/02/2020 @ 8:13pm (UTC)
        require(flightSuretyData.isFlightRegistered(firstAirline, "F1", 1591128835), "Flight could not be registered");

        flightSuretyData.registerFlight(firstAirline, "F2", 1591229835); // 06/04/2020 @ 12:17am (UTC)
        require(flightSuretyData.isFlightRegistered(firstAirline, "F2", 1591229835), "Flight could not be registered");

        flightSuretyData.registerFlight(firstAirline, "F3", 1591359935); // 06/05/2020 @ 12:25pm (UTC)
        require(flightSuretyData.isFlightRegistered(firstAirline, "F3", 1591359935), "Flight could not be registered");
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return flightSuretyData.isOperational();
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *
     */

    function registerAirline(address newAirlineAddress)
        external
        returns (bool success)
    {
        flightSuretyData.registerAirline(newAirlineAddress, msg.sender); // pass origin sender, so it does not change to FlightSuretyApp

        success = flightSuretyData.isAirlineRegistered(newAirlineAddress);

        return success;
    }

    function isAirline(address checkAddress) external view returns (bool) {
        return flightSuretyData.isAirlineRegistered(checkAddress);
    }

    function buyInsurance(
        address airline,
        string flight,
        uint256 timestamp
    ) external payable {
        // pass origin value. pass origin sender, so it does not change to FlightSuretyApp
        flightSuretyData.buyInsurance.value(msg.value)(airline, flight, timestamp, msg.sender);
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    // not needed for project requirements, because only internal registration
    /*
    function registerFlight() external pure {
    }
    */

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal {
        if(statusCode == STATUS_CODE_LATE_AIRLINE) {
            // passenger receives credit
            flightSuretyData.repayPassengerForFlight(airline, flight, timestamp);
        }
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
        });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function setOperatingStatus(bool mode) external {
        flightSuretyData.setOperatingStatus(mode, msg.sender); // pass origin sender, so it does not change to FlightSuretyApp
    }

    function getVotesForAirline(address airline) external view returns (uint) {
        return flightSuretyData.getVotesForAirline(airline);
    }

    function voteForAirline(address airline) external {
        flightSuretyData.voteForAirline(airline, msg.sender); // pass origin sender, so it does not change to FlightSuretyApp
    }

    function payFundForAirline() external payable {
        flightSuretyData.payFundForAirline.value(msg.value)(msg.sender); // pass origin sender, so it does not change to FlightSuretyApp
    }

    function withdrawInsurance(
        address airline,
        string flight,
        uint256 timestamp
    ) external payable {
        // pass origin sender, so it does not change to FlightSuretyApp
        flightSuretyData.withdrawInsurance(airline, flight, timestamp, msg.sender);
    }

    // ########################################################################
    // helper functions
    function toAsciiString(address x) internal pure returns (string) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(x) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    function char(byte b) internal pure returns (byte c) {
        if (uint8(b) < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }

    // ###################################################################
    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3]) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns (uint8[3]) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
    // ##################################################################
}


contract FlightSuretyDataInterface {
    function registerAirline(
        address newAirlineAddress,
        address currentAirlineAddress
    ) external;

    function registerFlight(address airline, string flightId, uint256 timestamp) external;

    function isFlightRegistered(
        address airline,
        string flightId,
        uint256 timestamp
    ) external view returns (bool);

    function isAirlineRegistered(address checkAddress) external view returns (bool);

    function getAirlineVotes(address airlineAddress) external returns (uint256);

    function buyInsurance(
        address airline,
        string flight,
        uint256 timestamp,
        address passenger
    ) external payable;

    function withdrawInsurance(
        address airline,
        string flight,
        uint256 timestamp,
        address passenger
    ) external payable;

    function repayPassengerForFlight(address airline,
        string flight,
        uint256 timestamp) external payable;

    function isOperational() public view returns (bool);

    function setOperatingStatus(bool mode, address caller) external;

    function getVotesForAirline(address airline) external view returns (uint);

    function payFundForAirline(address airline) external payable;

    function voteForAirline(address airline, address airlineVoter) external;
}
