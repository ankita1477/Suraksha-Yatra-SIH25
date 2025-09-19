const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const identityRoutes = require('./routes/identity');
const incidentRoutes = require('./routes/incidents');
const contractRoutes = require('./routes/contracts');

// Blockchain connection
let provider;
let wallet;

// Initialize blockchain connection
async function initializeBlockchain() {
    try {
        // Connect to blockchain network
        if (process.env.BLOCKCHAIN_NETWORK === 'polygon-mumbai') {
            provider = new ethers.JsonRpcProvider(`https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
        } else if (process.env.BLOCKCHAIN_NETWORK === 'polygon') {
            provider = new ethers.JsonRpcProvider(`https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
        } else {
            // Local development
            provider = new ethers.JsonRpcProvider('http://localhost:8545');
        }

        // Initialize wallet
        if (process.env.PRIVATE_KEY) {
            wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            console.log('Blockchain wallet initialized:', wallet.address);
        } else {
            console.warn('No private key provided, running in read-only mode');
        }

        // Test connection
        const network = await provider.getNetwork();
        console.log('Connected to blockchain network:', network.name);
        
        return true;
    } catch (error) {
        console.error('Failed to initialize blockchain connection:', error);
        return false;
    }
}

// Make blockchain instances available globally
app.locals.provider = provider;
app.locals.wallet = wallet;

// Routes
app.use('/api/identity', identityRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/contracts', contractRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'blockchain-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        blockchain: {
            connected: !!provider,
            network: process.env.BLOCKCHAIN_NETWORK,
            wallet: wallet ? wallet.address : 'not configured'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Start server
async function startServer() {
    try {
        // Initialize blockchain connection
        const blockchainReady = await initializeBlockchain();
        
        if (!blockchainReady) {
            console.warn('Starting server without blockchain connection');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Blockchain service running on port ${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⛓️  Blockchain network: ${process.env.BLOCKCHAIN_NETWORK || 'local'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();