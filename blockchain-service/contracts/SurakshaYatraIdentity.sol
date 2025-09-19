// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SurakshaYatraIdentity
 * @dev Digital Identity Management for Suraksha Yatra platform
 * Manages user identities, verification status, and emergency contacts
 */
contract SurakshaYatraIdentity is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    Counters.Counter private _identityIds;
    
    struct Identity {
        string did; // Decentralized Identifier
        address userAddress;
        string publicKey;
        uint256 createdAt;
        uint256 updatedAt;
        bool isVerified;
        bool isActive;
        string metadataHash; // IPFS hash for additional metadata
        uint256 reputationScore;
    }
    
    struct EmergencyContact {
        string name;
        string phoneNumber;
        string relationship;
        address contactAddress;
        bool isVerified;
        uint256 addedAt;
    }
    
    struct VerificationProof {
        string proofType;
        string proofValue;
        address verifierAddress;
        uint256 verifiedAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => Identity) public identities;
    mapping(address => uint256) public addressToIdentityId;
    mapping(string => uint256) public didToIdentityId;
    mapping(uint256 => EmergencyContact[]) public emergencyContacts;
    mapping(uint256 => VerificationProof[]) public verificationProofs;
    mapping(address => bool) public authorizedVerifiers;
    
    // Events
    event IdentityCreated(uint256 indexed identityId, string did, address indexed userAddress);
    event IdentityVerified(uint256 indexed identityId, address indexed verifier);
    event IdentityUpdated(uint256 indexed identityId, string newMetadataHash);
    event EmergencyContactAdded(uint256 indexed identityId, string contactName);
    event EmergencyContactVerified(uint256 indexed identityId, uint256 contactIndex);
    event VerificationProofAdded(uint256 indexed identityId, string proofType);
    event ReputationScoreUpdated(uint256 indexed identityId, uint256 newScore);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new digital identity
     * @param _did Decentralized Identifier
     * @param _publicKey User's public key
     * @param _metadataHash IPFS hash containing additional user metadata
     */
    function createIdentity(
        string memory _did,
        string memory _publicKey,
        string memory _metadataHash
    ) external nonReentrant returns (uint256) {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        require(addressToIdentityId[msg.sender] == 0, "Identity already exists for this address");
        require(didToIdentityId[_did] == 0, "DID already registered");
        
        _identityIds.increment();
        uint256 newIdentityId = _identityIds.current();
        
        identities[newIdentityId] = Identity({
            did: _did,
            userAddress: msg.sender,
            publicKey: _publicKey,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isVerified: false,
            isActive: true,
            metadataHash: _metadataHash,
            reputationScore: 100 // Starting reputation score
        });
        
        addressToIdentityId[msg.sender] = newIdentityId;
        didToIdentityId[_did] = newIdentityId;
        
        emit IdentityCreated(newIdentityId, _did, msg.sender);
        
        return newIdentityId;
    }
    
    /**
     * @dev Verify an identity (only verifiers can call this)
     * @param _identityId The identity ID to verify
     */
    function verifyIdentity(uint256 _identityId) external onlyRole(VERIFIER_ROLE) {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(identities[_identityId].isActive, "Identity is not active");
        
        identities[_identityId].isVerified = true;
        identities[_identityId].updatedAt = block.timestamp;
        
        emit IdentityVerified(_identityId, msg.sender);
    }
    
    /**
     * @dev Update identity metadata
     * @param _identityId The identity ID to update
     * @param _newMetadataHash New IPFS hash for metadata
     */
    function updateIdentity(uint256 _identityId, string memory _newMetadataHash) external {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(identities[_identityId].userAddress == msg.sender, "Not authorized to update this identity");
        require(identities[_identityId].isActive, "Identity is not active");
        
        identities[_identityId].metadataHash = _newMetadataHash;
        identities[_identityId].updatedAt = block.timestamp;
        
        emit IdentityUpdated(_identityId, _newMetadataHash);
    }
    
    /**
     * @dev Add emergency contact
     * @param _identityId The identity ID
     * @param _name Contact name
     * @param _phoneNumber Contact phone number
     * @param _relationship Relationship to user
     * @param _contactAddress Optional contact wallet address
     */
    function addEmergencyContact(
        uint256 _identityId,
        string memory _name,
        string memory _phoneNumber,
        string memory _relationship,
        address _contactAddress
    ) external {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(identities[_identityId].userAddress == msg.sender, "Not authorized");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_phoneNumber).length > 0, "Phone number cannot be empty");
        
        emergencyContacts[_identityId].push(EmergencyContact({
            name: _name,
            phoneNumber: _phoneNumber,
            relationship: _relationship,
            contactAddress: _contactAddress,
            isVerified: false,
            addedAt: block.timestamp
        }));
        
        emit EmergencyContactAdded(_identityId, _name);
    }
    
    /**
     * @dev Verify emergency contact (only verifiers can call this)
     * @param _identityId The identity ID
     * @param _contactIndex Index of the contact to verify
     */
    function verifyEmergencyContact(uint256 _identityId, uint256 _contactIndex) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(_contactIndex < emergencyContacts[_identityId].length, "Invalid contact index");
        
        emergencyContacts[_identityId][_contactIndex].isVerified = true;
        
        emit EmergencyContactVerified(_identityId, _contactIndex);
    }
    
    /**
     * @dev Add verification proof for identity
     * @param _identityId The identity ID
     * @param _proofType Type of proof (e.g., "government_id", "biometric")
     * @param _proofValue Proof value or hash
     * @param _expiresAt Expiration timestamp
     */
    function addVerificationProof(
        uint256 _identityId,
        string memory _proofType,
        string memory _proofValue,
        uint256 _expiresAt
    ) external onlyRole(VERIFIER_ROLE) {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(bytes(_proofType).length > 0, "Proof type cannot be empty");
        require(bytes(_proofValue).length > 0, "Proof value cannot be empty");
        require(_expiresAt > block.timestamp, "Expiration must be in future");
        
        verificationProofs[_identityId].push(VerificationProof({
            proofType: _proofType,
            proofValue: _proofValue,
            verifierAddress: msg.sender,
            verifiedAt: block.timestamp,
            expiresAt: _expiresAt,
            isActive: true
        }));
        
        emit VerificationProofAdded(_identityId, _proofType);
    }
    
    /**
     * @dev Update reputation score
     * @param _identityId The identity ID
     * @param _newScore New reputation score
     */
    function updateReputationScore(uint256 _identityId, uint256 _newScore) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(_newScore <= 1000, "Score cannot exceed 1000");
        
        identities[_identityId].reputationScore = _newScore;
        identities[_identityId].updatedAt = block.timestamp;
        
        emit ReputationScoreUpdated(_identityId, _newScore);
    }
    
    /**
     * @dev Deactivate identity
     * @param _identityId The identity ID to deactivate
     */
    function deactivateIdentity(uint256 _identityId) external {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        require(
            identities[_identityId].userAddress == msg.sender || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        
        identities[_identityId].isActive = false;
        identities[_identityId].updatedAt = block.timestamp;
    }
    
    // View functions
    
    /**
     * @dev Get identity by ID
     */
    function getIdentity(uint256 _identityId) external view returns (Identity memory) {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        return identities[_identityId];
    }
    
    /**
     * @dev Get identity by address
     */
    function getIdentityByAddress(address _userAddress) external view returns (Identity memory) {
        uint256 identityId = addressToIdentityId[_userAddress];
        require(identityId > 0, "No identity found for this address");
        return identities[identityId];
    }
    
    /**
     * @dev Get identity by DID
     */
    function getIdentityByDID(string memory _did) external view returns (Identity memory) {
        uint256 identityId = didToIdentityId[_did];
        require(identityId > 0, "No identity found for this DID");
        return identities[identityId];
    }
    
    /**
     * @dev Get emergency contacts for identity
     */
    function getEmergencyContacts(uint256 _identityId) 
        external 
        view 
        returns (EmergencyContact[] memory) 
    {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        return emergencyContacts[_identityId];
    }
    
    /**
     * @dev Get verification proofs for identity
     */
    function getVerificationProofs(uint256 _identityId) 
        external 
        view 
        returns (VerificationProof[] memory) 
    {
        require(_identityId > 0 && _identityId <= _identityIds.current(), "Invalid identity ID");
        return verificationProofs[_identityId];
    }
    
    /**
     * @dev Check if identity exists and is verified
     */
    function isVerifiedIdentity(address _userAddress) external view returns (bool) {
        uint256 identityId = addressToIdentityId[_userAddress];
        if (identityId == 0) return false;
        
        Identity memory identity = identities[identityId];
        return identity.isActive && identity.isVerified;
    }
    
    /**
     * @dev Get total number of identities created
     */
    function getTotalIdentities() external view returns (uint256) {
        return _identityIds.current();
    }
    
    // Admin functions
    
    /**
     * @dev Add authorized verifier
     */
    function addVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, _verifier);
        authorizedVerifiers[_verifier] = true;
    }
    
    /**
     * @dev Remove authorized verifier
     */
    function removeVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, _verifier);
        authorizedVerifiers[_verifier] = false;
    }
}