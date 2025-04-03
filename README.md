# SuiEscrow: Decentralized Milestone Payment System

![SuiEscrow Banner](https://example.com/banner-placeholder.png)

SuiEscrow is a decentralized escrow and milestone-based payment system built on the Sui blockchain. It enables secure, transparent, and trustless collaboration between clients and freelancers.

## 🌟 Features

- **Secure Escrow Contracts**: Funds are locked in a secure smart contract until work is completed
- **Milestone-Based Payments**: Break down projects into manageable milestones with individual payments
- **Role-Based Access**: Different interfaces and permissions for clients and freelancers
- **Community Dispute Resolution**: Fair conflict resolution through community voting
- **Transparent Process**: All actions are recorded on-chain with full visibility
- **Automatic Payments**: Instant fund release when milestones are approved

## 📋 Project Structure

### Smart Contracts (Move)

- `escrow.move`: Core escrow functionality for contract and milestone management
- `dispute.move`: Dispute creation and resolution system

### Frontend (React/TypeScript)

- **Dashboard Views**: Separate interfaces for clients and freelancers
- **Contract Management**: Creation, tracking, and completion of contracts
- **Milestone Tracking**: Submission, approval, and rejection workflows
- **Dispute Interface**: Creation and voting on disputes

## 🚀 Getting Started

### Prerequisites

- Sui CLI installed
- Node.js (v16+) and npm/yarn
- A Sui wallet (like Sui Wallet browser extension)

### Smart Contract Deployment

1. Clone this repository:
   ```
   git clone https://github.com/gboigwe/sui-escrow.git
   cd sui-escrow
   ```

2. Build and publish the Move modules:
   ```
   cd move
   sui move build
   sui client publish --gas-budget 100000000
   ```
   
3. Note the package ID for frontend configuration

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Update the package ID in `src/hooks/useEscrow.ts` and `src/hooks/useDispute.ts`

3. Start the development server:
   ```
   npm start
   ```

## 💻 Usage Guide

### For Clients

1. **Create Contract**: Define project details and set total budget
2. **Add Milestones**: Create specific milestones with descriptions, amounts, and deadlines
3. **Review Submissions**: Approve completed milestones or request changes
4. **Resolve Disputes**: Participate in dispute resolution if needed

### For Freelancers

1. **View Contracts**: Browse available contracts where you are assigned
2. **Submit Milestones**: Mark milestones as complete with submission notes
3. **Receive Payments**: Get automatic payments when work is approved
4. **Open Disputes**: Request community assistance for disagreements

## 🔒 Security

- All funds are locked in the escrow contract until explicit release
- Only authorized addresses can perform specific actions
- Community-based dispute resolution prevents unilateral decisions
- Contract code is fully auditable and transparent

## ⚙️ Technical Implementation

SuiEscrow leverages Sui's unique object-centric model and ownership system:

- **Object Ownership**: Contracts are shared objects that both client and freelancer can interact with
- **Dynamic Fields**: Used for storing milestone data efficiently
- **Events**: Contract interactions emit events for frontend reactivity
- **Access Controls**: Role-based permissions enforce proper authorization

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Acknowledgements

- Created for the Sui Overflow 2025 Hackathon
- Built with [Sui Move](https://docs.sui.io/build/move)
- Frontend developed using React, TypeScript, and TailwindCSS
- Wallet integration with [@mysten/wallet-kit](https://sdk.mystenlabs.com/wallet-kit)

---

*Note: This project is a prototype developed for demonstration purposes in the Sui Overflow 2025 Hackathon.*
