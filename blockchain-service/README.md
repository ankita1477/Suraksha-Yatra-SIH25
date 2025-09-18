# Blockchain Digital Identity Service

## Overview
This service implements a blockchain-based digital identity system for the Suraksha Yatra platform, providing:

- **Digital Identity Verification**: Secure, immutable user identity records
- **Incident Integrity**: Blockchain verification of incident reports
- **Smart Contracts**: Automated emergency response protocols
- **Decentralized Trust**: Tamper-proof incident verification
- **Privacy Protection**: Zero-knowledge proofs for sensitive data

## Features

### 1. Digital Identity Management
- Blockchain-based user registration
- Digital identity verification using DID (Decentralized Identifiers)
- Verifiable credentials for emergency contacts
- Immutable identity records

### 2. Incident Integrity
- Blockchain logging of all incidents
- Tamper-proof incident reports
- Cryptographic proof of incident authenticity
- Audit trail for all safety events

### 3. Smart Contracts
- Automated emergency response triggers
- Trust-based resource allocation
- Reputation system for service providers
- Automated insurance claims processing

### 4. Privacy & Security
- Zero-knowledge proofs for sensitive data
- End-to-end encryption
- Selective disclosure of information
- GDPR-compliant data handling

## Technology Stack

- **Blockchain**: Ethereum-compatible (Polygon for lower costs)
- **Smart Contracts**: Solidity
- **Backend**: Node.js with Web3.js
- **Storage**: IPFS for distributed storage
- **Identity**: DID standards (W3C)
- **Privacy**: Zero-knowledge SNARKs

## API Endpoints

### Identity Management
- `POST /api/identity/register` - Register new digital identity
- `POST /api/identity/verify` - Verify identity credentials
- `GET /api/identity/profile/{did}` - Get identity profile
- `PUT /api/identity/update` - Update identity information

### Incident Verification
- `POST /api/incidents/submit` - Submit incident to blockchain
- `GET /api/incidents/verify/{hash}` - Verify incident authenticity
- `GET /api/incidents/audit/{id}` - Get incident audit trail

### Smart Contracts
- `POST /api/contracts/deploy` - Deploy emergency response contract
- `POST /api/contracts/trigger` - Trigger smart contract execution
- `GET /api/contracts/status/{address}` - Get contract status

## Installation

```bash
cd blockchain-service
npm install
# Copy environment variables
cp .env.example .env
# Start the service
npm start
```

## Environment Variables

```env
NODE_ENV=development
PORT=3001
BLOCKCHAIN_NETWORK=polygon-mumbai
PRIVATE_KEY=your-wallet-private-key
INFURA_PROJECT_ID=your-infura-project-id
IPFS_GATEWAY=https://ipfs.io/ipfs/
CONTRACT_ADDRESS=deployed-contract-address
```

## Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network mumbai

# Verify contract
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
```