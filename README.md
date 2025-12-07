# LendQ - Decentralized Lending Protocol

> **Built for Qubic Hack the Future 2025**

LendQ is a decentralized lending market protocol that allows users to supply assets to earn interest and borrow assets by providing collateral. It features a clean, modern interface and robust risk management parameters.

![LendQ Dashboard](https://img.shields.io/badge/Status-Live-green)
![Qubic](https://img.shields.io/badge/Blockchain-Qubic-00D4FF)

## ✨ Features

- **Supply & Earn**: Deposit assets like QX to earn passive APY.
- **Borrow**: Borrow stablecoins (QUSD) against your collateral.
- **Risk Management**: Real-time health factor monitoring and liquidation protection.
- **Modern UI**: A professional, dark-themed dashboard with "glassmorphism" aesthetics.
- **Real-time Updates**: Instant balance and position updates via WebSockets.

## 🏗️ Architecture

The project consists of a React frontend and a Node.js/Express backend with an in-memory lending engine (simulating smart contract logic).

```
┌─────────────┐         ┌──────────────┐
│   Frontend  │◄───────►│    Backend   │
│  (React)    │ WebSocket│  (Node.js)   │
└─────────────┘         └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/CmxTop/LendQ.git
   cd LendQ
   npm install
   ```

2. **Run the application:**
   ```bash
   # Run both frontend and backend
   npm run dev:all
   ```

3. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🧪 Testing

We have a suite of test scripts to verify protocol logic:

```bash
# Verify withdrawal precision
node server/test-withdrawal-precision.js

# Verify dust repayment logic
node server/test-repay-dust.js
```

## 🎨 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, Socket.IO
- **Data:** In-memory database (simulating blockchain state)

## 📄 License

MIT License - Built for Qubic Hack the Future 2025
