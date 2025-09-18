const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const { createDID, verifyDID } = require('../utils/did');
const { uploadToIPFS } = require('../utils/ipfs');

const router = express.Router();

// Load contract ABI (you would import the actual compiled ABI)
const IDENTITY_CONTRACT_ABI = require('../contracts/SurakshaYatraIdentity.json').abi;

/**
 * POST /api/identity/register
 * Register a new digital identity on blockchain
 */
router.post('/register', async (req, res) => {
    try {
        const { userAddress, publicKey, personalInfo, emergencyContacts } = req.body;

        // Validate input
        if (!userAddress || !publicKey || !personalInfo) {
            return res.status(400).json({
                error: 'Missing required fields: userAddress, publicKey, personalInfo'
            });
        }

        // Get blockchain instances
        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        // Generate DID
        const did = createDID(userAddress);

        // Upload personal info to IPFS
        const personalData = {
            ...personalInfo,
            registeredAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const metadataHash = await uploadToIPFS(JSON.stringify(personalData));

        // Connect to identity contract
        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            wallet
        );

        // Create identity on blockchain
        const tx = await contract.createIdentity(did, publicKey, metadataHash, {
            gasLimit: 500000
        });

        const receipt = await tx.wait();
        
        // Extract identity ID from event logs
        const identityCreatedEvent = receipt.logs.find(
            log => log.topics[0] === ethers.id('IdentityCreated(uint256,string,address)')
        );
        
        let identityId;
        if (identityCreatedEvent) {
            const decoded = contract.interface.parseLog(identityCreatedEvent);
            identityId = decoded.args.identityId.toString();
        }

        // Add emergency contacts if provided
        if (emergencyContacts && emergencyContacts.length > 0) {
            for (const contact of emergencyContacts) {
                try {
                    await contract.addEmergencyContact(
                        identityId,
                        contact.name,
                        contact.phoneNumber,
                        contact.relationship,
                        contact.address || ethers.ZeroAddress
                    );
                } catch (contactError) {
                    console.warn('Failed to add emergency contact:', contactError);
                }
            }
        }

        res.json({
            success: true,
            identityId,
            did,
            transactionHash: tx.hash,
            metadataHash,
            blockNumber: receipt.blockNumber,
            message: 'Digital identity registered successfully'
        });

    } catch (error) {
        console.error('Identity registration error:', error);
        res.status(500).json({
            error: 'Failed to register identity',
            details: error.message
        });
    }
});

/**
 * POST /api/identity/verify
 * Verify an identity (for authorized verifiers only)
 */
router.post('/verify', async (req, res) => {
    try {
        const { identityId, verificationProofs } = req.body;

        if (!identityId) {
            return res.status(400).json({
                error: 'Identity ID is required'
            });
        }

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            wallet
        );

        // Verify the identity
        const tx = await contract.verifyIdentity(identityId, {
            gasLimit: 200000
        });

        const receipt = await tx.wait();

        // Add verification proofs if provided
        if (verificationProofs && verificationProofs.length > 0) {
            for (const proof of verificationProofs) {
                try {
                    const expiresAt = Math.floor(Date.now() / 1000) + (proof.validityDays || 365) * 24 * 60 * 60;
                    await contract.addVerificationProof(
                        identityId,
                        proof.type,
                        proof.value,
                        expiresAt
                    );
                } catch (proofError) {
                    console.warn('Failed to add verification proof:', proofError);
                }
            }
        }

        res.json({
            success: true,
            identityId,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            verifier: wallet.address,
            verifiedAt: new Date().toISOString(),
            message: 'Identity verified successfully'
        });

    } catch (error) {
        console.error('Identity verification error:', error);
        res.status(500).json({
            error: 'Failed to verify identity',
            details: error.message
        });
    }
});

/**
 * GET /api/identity/profile/:identifier
 * Get identity profile by ID, DID, or address
 */
router.get('/profile/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const { includeProofs, includeContacts } = req.query;

        const { provider } = req.app.locals;
        if (!provider) {
            return res.status(503).json({
                error: 'Blockchain connection not available'
            });
        }

        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            provider
        );

        let identity;

        // Try to get identity by different methods
        if (identifier.startsWith('did:')) {
            // Get by DID
            identity = await contract.getIdentityByDID(identifier);
        } else if (ethers.isAddress(identifier)) {
            // Get by address
            identity = await contract.getIdentityByAddress(identifier);
        } else if (!isNaN(identifier)) {
            // Get by ID
            identity = await contract.getIdentity(parseInt(identifier));
        } else {
            return res.status(400).json({
                error: 'Invalid identifier format'
            });
        }

        // Convert BigInt values to strings for JSON serialization
        const formattedIdentity = {
            id: identity.id.toString(),
            did: identity.did,
            userAddress: identity.userAddress,
            publicKey: identity.publicKey,
            createdAt: new Date(Number(identity.createdAt) * 1000).toISOString(),
            updatedAt: new Date(Number(identity.updatedAt) * 1000).toISOString(),
            isVerified: identity.isVerified,
            isActive: identity.isActive,
            metadataHash: identity.metadataHash,
            reputationScore: identity.reputationScore.toString()
        };

        // Include additional data if requested
        if (includeProofs === 'true') {
            const proofs = await contract.getVerificationProofs(identity.id);
            formattedIdentity.verificationProofs = proofs.map(proof => ({
                proofType: proof.proofType,
                proofValue: proof.proofValue,
                verifierAddress: proof.verifierAddress,
                verifiedAt: new Date(Number(proof.verifiedAt) * 1000).toISOString(),
                expiresAt: new Date(Number(proof.expiresAt) * 1000).toISOString(),
                isActive: proof.isActive
            }));
        }

        if (includeContacts === 'true') {
            const contacts = await contract.getEmergencyContacts(identity.id);
            formattedIdentity.emergencyContacts = contacts.map(contact => ({
                name: contact.name,
                phoneNumber: contact.phoneNumber,
                relationship: contact.relationship,
                contactAddress: contact.contactAddress,
                isVerified: contact.isVerified,
                addedAt: new Date(Number(contact.addedAt) * 1000).toISOString()
            }));
        }

        res.json({
            success: true,
            identity: formattedIdentity
        });

    } catch (error) {
        console.error('Get identity profile error:', error);
        res.status(500).json({
            error: 'Failed to get identity profile',
            details: error.message
        });
    }
});

/**
 * PUT /api/identity/update
 * Update identity metadata
 */
router.put('/update', async (req, res) => {
    try {
        const { identityId, updatedInfo, userAddress } = req.body;

        if (!identityId || !updatedInfo) {
            return res.status(400).json({
                error: 'Identity ID and updated info are required'
            });
        }

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        // Upload updated info to IPFS
        const updatedData = {
            ...updatedInfo,
            updatedAt: new Date().toISOString(),
            version: '1.1'
        };

        const newMetadataHash = await uploadToIPFS(JSON.stringify(updatedData));

        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            wallet
        );

        // Update identity on blockchain
        const tx = await contract.updateIdentity(identityId, newMetadataHash, {
            gasLimit: 200000
        });

        const receipt = await tx.wait();

        res.json({
            success: true,
            identityId,
            newMetadataHash,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            message: 'Identity updated successfully'
        });

    } catch (error) {
        console.error('Identity update error:', error);
        res.status(500).json({
            error: 'Failed to update identity',
            details: error.message
        });
    }
});

/**
 * POST /api/identity/emergency-contact
 * Add emergency contact
 */
router.post('/emergency-contact', async (req, res) => {
    try {
        const { identityId, name, phoneNumber, relationship, contactAddress } = req.body;

        if (!identityId || !name || !phoneNumber || !relationship) {
            return res.status(400).json({
                error: 'Identity ID, name, phone number, and relationship are required'
            });
        }

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            wallet
        );

        const tx = await contract.addEmergencyContact(
            identityId,
            name,
            phoneNumber,
            relationship,
            contactAddress || ethers.ZeroAddress,
            {
                gasLimit: 300000
            }
        );

        const receipt = await tx.wait();

        res.json({
            success: true,
            identityId,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            message: 'Emergency contact added successfully'
        });

    } catch (error) {
        console.error('Add emergency contact error:', error);
        res.status(500).json({
            error: 'Failed to add emergency contact',
            details: error.message
        });
    }
});

/**
 * GET /api/identity/verify-status/:address
 * Check if an address has a verified identity
 */
router.get('/verify-status/:address', async (req, res) => {
    try {
        const { address } = req.params;

        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                error: 'Invalid address format'
            });
        }

        const { provider } = req.app.locals;
        if (!provider) {
            return res.status(503).json({
                error: 'Blockchain connection not available'
            });
        }

        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            provider
        );

        const isVerified = await contract.isVerifiedIdentity(address);

        res.json({
            success: true,
            address,
            isVerified,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Verify status error:', error);
        res.status(500).json({
            error: 'Failed to check verification status',
            details: error.message
        });
    }
});

/**
 * GET /api/identity/stats
 * Get identity statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { provider } = req.app.locals;
        if (!provider) {
            return res.status(503).json({
                error: 'Blockchain connection not available'
            });
        }

        const contract = new ethers.Contract(
            process.env.IDENTITY_CONTRACT_ADDRESS,
            IDENTITY_CONTRACT_ABI,
            provider
        );

        const totalIdentities = await contract.getTotalIdentities();

        res.json({
            success: true,
            statistics: {
                totalIdentities: totalIdentities.toString(),
                contractAddress: process.env.IDENTITY_CONTRACT_ADDRESS,
                checkedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics',
            details: error.message
        });
    }
});

module.exports = router;