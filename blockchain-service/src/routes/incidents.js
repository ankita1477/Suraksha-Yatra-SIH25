const express = require('express');
const { ethers } = require('ethers');
const { uploadToIPFS, getFromIPFS } = require('../utils/ipfs');

const router = express.Router();

// Load contract ABI
const INCIDENT_REGISTRY_ABI = require('../contracts/IncidentRegistry.json').abi;

/**
 * POST /api/incidents/register
 * Register a new incident on the blockchain
 */
router.post('/register', async (req, res) => {
    try {
        const { incidentId, incidentType, description, location, severity, reporterAddress, evidenceFiles } = req.body;

        // Validate required fields
        if (!incidentId || !incidentType || !description || !location || !reporterAddress) {
            return res.status(400).json({
                error: 'Missing required fields: incidentId, incidentType, description, location, reporterAddress'
            });
        }

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        // Prepare incident data for IPFS
        const incidentData = {
            incidentId,
            description,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address
            },
            timestamp: new Date().toISOString(),
            severity: severity || 'medium',
            additionalDetails: req.body.additionalDetails || {},
            evidenceHashes: []
        };

        // Upload evidence files to IPFS if provided
        if (evidenceFiles && evidenceFiles.length > 0) {
            for (const file of evidenceFiles) {
                try {
                    const evidenceHash = await uploadToIPFS(file);
                    incidentData.evidenceHashes.push({
                        hash: evidenceHash,
                        type: file.type || 'unknown',
                        name: file.name || 'evidence'
                    });
                } catch (evidenceError) {
                    console.warn('Failed to upload evidence file:', evidenceError);
                }
            }
        }

        // Upload incident data to IPFS
        const metadataHash = await uploadToIPFS(JSON.stringify(incidentData));

        // Connect to incident registry contract
        const contract = new ethers.Contract(
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            wallet
        );

        // Register incident on blockchain
        const tx = await contract.registerIncident(
            incidentId,
            incidentType,
            metadataHash,
            reporterAddress,
            {
                gasLimit: 500000
            }
        );

        const receipt = await tx.wait();

        // Extract blockchain incident ID from event logs
        let blockchainIncidentId;
        const incidentRegisteredEvent = receipt.logs.find(
            log => log.topics[0] === ethers.id('IncidentRegistered(uint256,string,string,address,uint256)')
        );

        if (incidentRegisteredEvent) {
            const decoded = contract.interface.parseLog(incidentRegisteredEvent);
            blockchainIncidentId = decoded.args.blockchainId.toString();
        }

        res.json({
            success: true,
            blockchainIncidentId,
            incidentId,
            metadataHash,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            evidenceCount: incidentData.evidenceHashes.length,
            message: 'Incident registered on blockchain successfully'
        });

    } catch (error) {
        console.error('Incident registration error:', error);
        res.status(500).json({
            error: 'Failed to register incident',
            details: error.message
        });
    }
});

/**
 * PUT /api/incidents/:incidentId/status
 * Update incident status
 */
router.put('/:incidentId/status', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { status, resolverAddress, resolutionNotes } = req.body;

        if (!status) {
            return res.status(400).json({
                error: 'Status is required'
            });
        }

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        const contract = new ethers.Contract(
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            wallet
        );

        // Get blockchain incident ID
        const blockchainId = await contract.getIncidentByOriginalId(incidentId);
        
        if (!blockchainId || blockchainId.toString() === '0') {
            return res.status(404).json({
                error: 'Incident not found on blockchain'
            });
        }

        // Upload resolution notes to IPFS if provided
        let resolutionHash = '';
        if (resolutionNotes) {
            const resolutionData = {
                notes: resolutionNotes,
                resolvedAt: new Date().toISOString(),
                resolverAddress: resolverAddress || wallet.address
            };
            resolutionHash = await uploadToIPFS(JSON.stringify(resolutionData));
        }

        // Update status on blockchain
        const tx = await contract.updateIncidentStatus(
            blockchainId,
            status,
            resolutionHash,
            {
                gasLimit: 300000
            }
        );

        const receipt = await tx.wait();

        res.json({
            success: true,
            incidentId,
            blockchainIncidentId: blockchainId.toString(),
            newStatus: status,
            resolutionHash,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            updatedBy: wallet.address,
            message: 'Incident status updated successfully'
        });

    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({
            error: 'Failed to update incident status',
            details: error.message
        });
    }
});

/**
 * POST /api/incidents/:incidentId/response
 * Add emergency response record
 */
router.post('/:incidentId/response', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { responseType, responderAddress, responseDetails, arrivalTime, resolutionTime } = req.body;

        if (!responseType || !responderAddress) {
            return res.status(400).json({
                error: 'Response type and responder address are required'
            });
        }

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        const contract = new ethers.Contract(
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            wallet
        );

        // Get blockchain incident ID
        const blockchainId = await contract.getIncidentByOriginalId(incidentId);
        
        if (!blockchainId || blockchainId.toString() === '0') {
            return res.status(404).json({
                error: 'Incident not found on blockchain'
            });
        }

        // Upload response details to IPFS
        const responseData = {
            responseType,
            responseDetails: responseDetails || '',
            arrivalTime: arrivalTime || new Date().toISOString(),
            resolutionTime: resolutionTime || null,
            recordedAt: new Date().toISOString()
        };

        const responseHash = await uploadToIPFS(JSON.stringify(responseData));

        // Add response to blockchain
        const tx = await contract.addEmergencyResponse(
            blockchainId,
            responseType,
            responderAddress,
            responseHash,
            {
                gasLimit: 400000
            }
        );

        const receipt = await tx.wait();

        res.json({
            success: true,
            incidentId,
            blockchainIncidentId: blockchainId.toString(),
            responseType,
            responderAddress,
            responseHash,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            message: 'Emergency response recorded successfully'
        });

    } catch (error) {
        console.error('Add response error:', error);
        res.status(500).json({
            error: 'Failed to add emergency response',
            details: error.message
        });
    }
});

/**
 * GET /api/incidents/:incidentId
 * Get incident details from blockchain
 */
router.get('/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { includeResponses, includeMetadata } = req.query;

        const { provider } = req.app.locals;
        if (!provider) {
            return res.status(503).json({
                error: 'Blockchain connection not available'
            });
        }

        const contract = new ethers.Contract(
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            provider
        );

        // Get blockchain incident ID
        const blockchainId = await contract.getIncidentByOriginalId(incidentId);
        
        if (!blockchainId || blockchainId.toString() === '0') {
            return res.status(404).json({
                error: 'Incident not found on blockchain'
            });
        }

        // Get incident details
        const incident = await contract.getIncident(blockchainId);

        // Format the response
        const formattedIncident = {
            blockchainId: incident.id.toString(),
            originalIncidentId: incident.originalIncidentId,
            incidentType: incident.incidentType,
            reporterAddress: incident.reporterAddress,
            registeredAt: new Date(Number(incident.registeredAt) * 1000).toISOString(),
            updatedAt: new Date(Number(incident.updatedAt) * 1000).toISOString(),
            status: incident.status,
            metadataHash: incident.metadataHash,
            resolutionHash: incident.resolutionHash,
            isVerified: incident.isVerified
        };

        // Include metadata from IPFS if requested
        if (includeMetadata === 'true' && incident.metadataHash) {
            try {
                const metadataString = await getFromIPFS(incident.metadataHash);
                formattedIncident.metadata = JSON.parse(metadataString);
            } catch (metadataError) {
                console.warn('Failed to fetch metadata from IPFS:', metadataError);
                formattedIncident.metadata = null;
            }
        }

        // Include resolution data if available
        if (incident.resolutionHash) {
            try {
                const resolutionString = await getFromIPFS(incident.resolutionHash);
                formattedIncident.resolution = JSON.parse(resolutionString);
            } catch (resolutionError) {
                console.warn('Failed to fetch resolution from IPFS:', resolutionError);
                formattedIncident.resolution = null;
            }
        }

        // Include emergency responses if requested
        if (includeResponses === 'true') {
            try {
                const responses = await contract.getEmergencyResponses(blockchainId);
                formattedIncident.emergencyResponses = [];

                for (const response of responses) {
                    const formattedResponse = {
                        responseType: response.responseType,
                        responderAddress: response.responderAddress,
                        respondedAt: new Date(Number(response.respondedAt) * 1000).toISOString(),
                        responseHash: response.responseHash
                    };

                    // Get response details from IPFS
                    if (response.responseHash) {
                        try {
                            const responseString = await getFromIPFS(response.responseHash);
                            formattedResponse.details = JSON.parse(responseString);
                        } catch (responseError) {
                            console.warn('Failed to fetch response details from IPFS:', responseError);
                            formattedResponse.details = null;
                        }
                    }

                    formattedIncident.emergencyResponses.push(formattedResponse);
                }
            } catch (responsesError) {
                console.warn('Failed to fetch emergency responses:', responsesError);
                formattedIncident.emergencyResponses = [];
            }
        }

        res.json({
            success: true,
            incident: formattedIncident
        });

    } catch (error) {
        console.error('Get incident error:', error);
        res.status(500).json({
            error: 'Failed to get incident details',
            details: error.message
        });
    }
});

/**
 * POST /api/incidents/:incidentId/verify
 * Verify incident (for authorized verifiers)
 */
router.post('/:incidentId/verify', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const { verificationNotes } = req.body;

        const { provider, wallet } = req.app.locals;
        if (!wallet) {
            return res.status(503).json({
                error: 'Blockchain wallet not configured'
            });
        }

        const contract = new ethers.Contract(
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            wallet
        );

        // Get blockchain incident ID
        const blockchainId = await contract.getIncidentByOriginalId(incidentId);
        
        if (!blockchainId || blockchainId.toString() === '0') {
            return res.status(404).json({
                error: 'Incident not found on blockchain'
            });
        }

        // Upload verification notes to IPFS if provided
        let verificationHash = '';
        if (verificationNotes) {
            const verificationData = {
                notes: verificationNotes,
                verifiedAt: new Date().toISOString(),
                verifierAddress: wallet.address
            };
            verificationHash = await uploadToIPFS(JSON.stringify(verificationData));
        }

        // Verify incident on blockchain
        const tx = await contract.verifyIncident(blockchainId, {
            gasLimit: 200000
        });

        const receipt = await tx.wait();

        res.json({
            success: true,
            incidentId,
            blockchainIncidentId: blockchainId.toString(),
            verifiedBy: wallet.address,
            verificationHash,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            message: 'Incident verified successfully'
        });

    } catch (error) {
        console.error('Incident verification error:', error);
        res.status(500).json({
            error: 'Failed to verify incident',
            details: error.message
        });
    }
});

/**
 * GET /api/incidents/stats
 * Get incident statistics from blockchain
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
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            provider
        );

        const totalIncidents = await contract.getTotalIncidents();

        res.json({
            success: true,
            statistics: {
                totalIncidents: totalIncidents.toString(),
                contractAddress: process.env.INCIDENT_REGISTRY_ADDRESS,
                checkedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get incident stats error:', error);
        res.status(500).json({
            error: 'Failed to get incident statistics',
            details: error.message
        });
    }
});

/**
 * GET /api/incidents/by-reporter/:address
 * Get incidents by reporter address
 */
router.get('/by-reporter/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 10, status } = req.query;

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
            process.env.INCIDENT_REGISTRY_ADDRESS,
            INCIDENT_REGISTRY_ABI,
            provider
        );

        // Get incidents by reporter (this would require implementing a mapping in the contract)
        // For now, we'll return a placeholder response
        res.json({
            success: true,
            reporterAddress: address,
            incidents: [],
            message: 'Feature requires contract enhancement for efficient querying'
        });

    } catch (error) {
        console.error('Get incidents by reporter error:', error);
        res.status(500).json({
            error: 'Failed to get incidents by reporter',
            details: error.message
        });
    }
});

module.exports = router;