// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IncidentRegistry
 * @dev Blockchain registry for incident reports with integrity verification
 * Provides tamper-proof logging of safety incidents
 */
contract IncidentRegistry is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant RESPONDER_ROLE = keccak256("RESPONDER_ROLE");
    
    Counters.Counter private _incidentIds;
    
    enum IncidentStatus { Reported, Verified, Acknowledged, Responding, Resolved, Closed }
    enum IncidentType { Emergency, Accident, Crime, Medical, Fire, Natural, Other }
    enum Severity { Low, Medium, High, Critical }
    
    struct Incident {
        uint256 id;
        string externalId; // Reference to off-chain database
        address reporter;
        uint256 reporterIdentityId;
        IncidentType incidentType;
        Severity severity;
        IncidentStatus status;
        uint256 timestamp;
        string locationHash; // Encrypted location data hash
        string dataHash; // IPFS hash for incident data
        string evidenceHash; // IPFS hash for evidence
        bool isVerified;
        address verifier;
        uint256 verifiedAt;
        string responseHash; // IPFS hash for response data
        uint256 resolvedAt;
    }
    
    struct IncidentUpdate {
        uint256 incidentId;
        address updater;
        IncidentStatus newStatus;
        string updateHash; // IPFS hash for update details
        uint256 timestamp;
        string notes;
    }
    
    struct Response {
        uint256 incidentId;
        address responder;
        string responderType; // "police", "medical", "fire", etc.
        uint256 responseTime;
        string responseDataHash; // IPFS hash for response details
        uint256 timestamp;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => Incident) public incidents;
    mapping(string => uint256) public externalIdToIncidentId;
    mapping(uint256 => IncidentUpdate[]) public incidentUpdates;
    mapping(uint256 => Response[]) public incidentResponses;
    mapping(address => uint256[]) public reporterIncidents;
    mapping(bytes32 => uint256) public dataHashToIncidentId;
    
    // Statistics
    mapping(IncidentType => uint256) public incidentTypeCount;
    mapping(Severity => uint256) public severityCount;
    mapping(IncidentStatus => uint256) public statusCount;
    
    // Events
    event IncidentReported(
        uint256 indexed incidentId,
        address indexed reporter,
        IncidentType incidentType,
        Severity severity,
        string dataHash
    );
    event IncidentVerified(uint256 indexed incidentId, address indexed verifier);
    event IncidentStatusUpdated(
        uint256 indexed incidentId,
        IncidentStatus oldStatus,
        IncidentStatus newStatus,
        address updater
    );
    event ResponseAdded(uint256 indexed incidentId, address indexed responder, string responderType);
    event IncidentResolved(uint256 indexed incidentId, uint256 resolvedAt);
    event EvidenceAdded(uint256 indexed incidentId, string evidenceHash);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REPORTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(RESPONDER_ROLE, msg.sender);
    }
    
    /**
     * @dev Report a new incident
     * @param _externalId External database reference ID
     * @param _reporterIdentityId Reporter's blockchain identity ID
     * @param _incidentType Type of incident
     * @param _severity Severity level
     * @param _locationHash Encrypted location data hash
     * @param _dataHash IPFS hash containing incident details
     */
    function reportIncident(
        string memory _externalId,
        uint256 _reporterIdentityId,
        IncidentType _incidentType,
        Severity _severity,
        string memory _locationHash,
        string memory _dataHash
    ) external onlyRole(REPORTER_ROLE) nonReentrant returns (uint256) {
        require(bytes(_externalId).length > 0, "External ID cannot be empty");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");
        require(externalIdToIncidentId[_externalId] == 0, "Incident with this external ID already exists");
        
        _incidentIds.increment();
        uint256 newIncidentId = _incidentIds.current();
        
        incidents[newIncidentId] = Incident({
            id: newIncidentId,
            externalId: _externalId,
            reporter: msg.sender,
            reporterIdentityId: _reporterIdentityId,
            incidentType: _incidentType,
            severity: _severity,
            status: IncidentStatus.Reported,
            timestamp: block.timestamp,
            locationHash: _locationHash,
            dataHash: _dataHash,
            evidenceHash: "",
            isVerified: false,
            verifier: address(0),
            verifiedAt: 0,
            responseHash: "",
            resolvedAt: 0
        });
        
        // Update mappings and statistics
        externalIdToIncidentId[_externalId] = newIncidentId;
        reporterIncidents[msg.sender].push(newIncidentId);
        dataHashToIncidentId[keccak256(abi.encodePacked(_dataHash))] = newIncidentId;
        
        incidentTypeCount[_incidentType]++;
        severityCount[_severity]++;
        statusCount[IncidentStatus.Reported]++;
        
        emit IncidentReported(newIncidentId, msg.sender, _incidentType, _severity, _dataHash);
        
        return newIncidentId;
    }
    
    /**
     * @dev Verify an incident report
     * @param _incidentId Incident ID to verify
     */
    function verifyIncident(uint256 _incidentId) external onlyRole(VERIFIER_ROLE) {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        require(!incidents[_incidentId].isVerified, "Incident already verified");
        
        incidents[_incidentId].isVerified = true;
        incidents[_incidentId].verifier = msg.sender;
        incidents[_incidentId].verifiedAt = block.timestamp;
        
        _updateIncidentStatus(_incidentId, IncidentStatus.Verified, "Incident verified by authority");
        
        emit IncidentVerified(_incidentId, msg.sender);
    }
    
    /**
     * @dev Update incident status
     * @param _incidentId Incident ID
     * @param _newStatus New status
     * @param _notes Additional notes for the update
     */
    function updateIncidentStatus(
        uint256 _incidentId,
        IncidentStatus _newStatus,
        string memory _notes
    ) external {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        require(
            hasRole(VERIFIER_ROLE, msg.sender) || 
            hasRole(RESPONDER_ROLE, msg.sender) ||
            incidents[_incidentId].reporter == msg.sender,
            "Not authorized to update this incident"
        );
        
        _updateIncidentStatus(_incidentId, _newStatus, _notes);
    }
    
    /**
     * @dev Internal function to update incident status
     */
    function _updateIncidentStatus(
        uint256 _incidentId,
        IncidentStatus _newStatus,
        string memory _notes
    ) internal {
        IncidentStatus oldStatus = incidents[_incidentId].status;
        incidents[_incidentId].status = _newStatus;
        
        // Update statistics
        statusCount[oldStatus]--;
        statusCount[_newStatus]++;
        
        // Add update record
        incidentUpdates[_incidentId].push(IncidentUpdate({
            incidentId: _incidentId,
            updater: msg.sender,
            newStatus: _newStatus,
            updateHash: "",
            timestamp: block.timestamp,
            notes: _notes
        }));
        
        // Mark as resolved if status is resolved
        if (_newStatus == IncidentStatus.Resolved && incidents[_incidentId].resolvedAt == 0) {
            incidents[_incidentId].resolvedAt = block.timestamp;
            emit IncidentResolved(_incidentId, block.timestamp);
        }
        
        emit IncidentStatusUpdated(_incidentId, oldStatus, _newStatus, msg.sender);
    }
    
    /**
     * @dev Add emergency response to incident
     * @param _incidentId Incident ID
     * @param _responderType Type of responder (police, medical, fire, etc.)
     * @param _responseDataHash IPFS hash for response details
     */
    function addResponse(
        uint256 _incidentId,
        string memory _responderType,
        string memory _responseDataHash
    ) external onlyRole(RESPONDER_ROLE) {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        require(bytes(_responderType).length > 0, "Responder type cannot be empty");
        
        incidentResponses[_incidentId].push(Response({
            incidentId: _incidentId,
            responder: msg.sender,
            responderType: _responderType,
            responseTime: block.timestamp - incidents[_incidentId].timestamp,
            responseDataHash: _responseDataHash,
            timestamp: block.timestamp,
            isActive: true
        }));
        
        // Update incident status to responding if not already
        if (incidents[_incidentId].status == IncidentStatus.Verified || 
            incidents[_incidentId].status == IncidentStatus.Acknowledged) {
            _updateIncidentStatus(_incidentId, IncidentStatus.Responding, "Emergency response initiated");
        }
        
        emit ResponseAdded(_incidentId, msg.sender, _responderType);
    }
    
    /**
     * @dev Add evidence to incident
     * @param _incidentId Incident ID
     * @param _evidenceHash IPFS hash for evidence
     */
    function addEvidence(uint256 _incidentId, string memory _evidenceHash) external {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        require(bytes(_evidenceHash).length > 0, "Evidence hash cannot be empty");
        require(
            incidents[_incidentId].reporter == msg.sender ||
            hasRole(VERIFIER_ROLE, msg.sender) ||
            hasRole(RESPONDER_ROLE, msg.sender),
            "Not authorized to add evidence"
        );
        
        // Append to existing evidence hash or set if empty
        if (bytes(incidents[_incidentId].evidenceHash).length == 0) {
            incidents[_incidentId].evidenceHash = _evidenceHash;
        } else {
            incidents[_incidentId].evidenceHash = string(abi.encodePacked(
                incidents[_incidentId].evidenceHash,
                ",",
                _evidenceHash
            ));
        }
        
        emit EvidenceAdded(_incidentId, _evidenceHash);
    }
    
    /**
     * @dev Get incident details
     */
    function getIncident(uint256 _incidentId) external view returns (Incident memory) {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        return incidents[_incidentId];
    }
    
    /**
     * @dev Get incident by external ID
     */
    function getIncidentByExternalId(string memory _externalId) external view returns (Incident memory) {
        uint256 incidentId = externalIdToIncidentId[_externalId];
        require(incidentId > 0, "No incident found with this external ID");
        return incidents[incidentId];
    }
    
    /**
     * @dev Get incident updates
     */
    function getIncidentUpdates(uint256 _incidentId) external view returns (IncidentUpdate[] memory) {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        return incidentUpdates[_incidentId];
    }
    
    /**
     * @dev Get incident responses
     */
    function getIncidentResponses(uint256 _incidentId) external view returns (Response[] memory) {
        require(_incidentId > 0 && _incidentId <= _incidentIds.current(), "Invalid incident ID");
        return incidentResponses[_incidentId];
    }
    
    /**
     * @dev Get incidents reported by address
     */
    function getReporterIncidents(address _reporter) external view returns (uint256[] memory) {
        return reporterIncidents[_reporter];
    }
    
    /**
     * @dev Verify incident integrity by data hash
     */
    function verifyIncidentIntegrity(string memory _dataHash) external view returns (bool, uint256) {
        bytes32 hashKey = keccak256(abi.encodePacked(_dataHash));
        uint256 incidentId = dataHashToIncidentId[hashKey];
        
        if (incidentId == 0) {
            return (false, 0);
        }
        
        return (keccak256(abi.encodePacked(incidents[incidentId].dataHash)) == hashKey, incidentId);
    }
    
    /**
     * @dev Get platform statistics
     */
    function getStatistics() external view returns (
        uint256 totalIncidents,
        uint256 verifiedIncidents,
        uint256 resolvedIncidents,
        uint256 averageResponseTime
    ) {
        totalIncidents = _incidentIds.current();
        verifiedIncidents = 0;
        resolvedIncidents = 0;
        uint256 totalResponseTime = 0;
        uint256 responseCount = 0;
        
        for (uint256 i = 1; i <= totalIncidents; i++) {
            if (incidents[i].isVerified) {
                verifiedIncidents++;
            }
            if (incidents[i].status == IncidentStatus.Resolved || 
                incidents[i].status == IncidentStatus.Closed) {
                resolvedIncidents++;
            }
            
            // Calculate response times
            Response[] memory responses = incidentResponses[i];
            for (uint256 j = 0; j < responses.length; j++) {
                totalResponseTime += responses[j].responseTime;
                responseCount++;
            }
        }
        
        averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    }
    
    /**
     * @dev Get total incidents count
     */
    function getTotalIncidents() external view returns (uint256) {
        return _incidentIds.current();
    }
    
    // Admin functions
    
    /**
     * @dev Add reporter role to address
     */
    function addReporter(address _reporter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(REPORTER_ROLE, _reporter);
    }
    
    /**
     * @dev Add verifier role to address
     */
    function addVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, _verifier);
    }
    
    /**
     * @dev Add responder role to address
     */
    function addResponder(address _responder) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RESPONDER_ROLE, _responder);
    }
}