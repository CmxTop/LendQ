# 🛍️ QubicShop - Crypto E-commerce Platform

> **Built for Qubic Hack the Future 2025** - Track 2: EasyConnect Integration

A modern e-commerce platform that accepts QUBIC cryptocurrency with real-time payment detection using EasyConnect automation.

![QubicShop Demo](https://img.shields.io/badge/Status-Hackathon%20Project-blue)
![Qubic](https://img.shields.io/badge/Blockchain-Qubic-00D4FF)
![EasyConnect](https://img.shields.io/badge/Integration-EasyConnect-0066FF)

## ✨ Features

- 🎨 **Premium UI/UX** - Glassmorphism design with smooth animations
- 🛒 **Shopping Cart** - Full cart management with quantity controls
- 💳 **Crypto Payments** - Accept QUBIC tokens with QR code support
- ⚡ **Real-time Updates** - Instant payment confirmation via EasyConnect webhooks
- 🔒 **Secure** - Blockchain-verified transactions
- 📱 **Responsive** - Works on all devices

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │◄───────►│    Backend   │◄───────►│ EasyConnect │
│  (React)    │ WebSocket│  (Express)   │ Webhook │  (Qubic)    │
└─────────────┘         └──────────────┘         └─────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ Qubic Network│
                        └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Qubic wallet address

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd /home/olamilekan/Documents/hackathon/LendQ
   npm install
   ```

2. **Configure your Qubic wallet:**
   
   Edit `src/components/CheckoutModal.jsx` and replace the demo wallet address:
   ```javascript
   const QUBIC_WALLET_ADDRESS = 'YOUR_ACTUAL_QUBIC_WALLET_ADDRESS'
   ```

3. **Run the application:**
   ```bash
   # Run both frontend and backend
   npm run dev:all
   
   # Or run separately:
   npm run dev      # Frontend only (http://localhost:5173)
   npm run server   # Backend only (http://localhost:3001)
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api/health

## 🔗 EasyConnect Integration

### Setup Instructions

1. **Expose your webhook endpoint:**
   
   For local development, use ngrok:
   ```bash
   ngrok http 3001
   ```
   
   You'll get a URL like: `https://abc123.ngrok.io`

2. **Configure EasyConnect:**
   
   - Go to [EasyConnect Dashboard](https://easyconnect.kairos.com) (or your EasyConnect provider)
   - Create a new automation
   - **Trigger:** "Qubic Transaction Received"
   - **Condition:** Transaction to your wallet address
   - **Action:** HTTP POST to `https://your-ngrok-url.ngrok.io/api/webhook/payment`
   
3. **Webhook Payload Format:**
   
   EasyConnect should send:
   ```json
   {
     "transactionId": "string",
     "amount": number,
     "fromAddress": "string",
     "toAddress": "string",
     "timestamp": "ISO 8601 string",
     "status": "confirmed"
   }
   ```

4. **Test the integration:**
   
   Use the test endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/test/trigger-payment \
     -H "Content-Type: application/json" \
     -d '{"amount": 1000}'
   ```

## 📁 Project Structure

```
LendQ/
├── src/
│   ├── App.jsx                    # Main application
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles
│   └── components/
│       ├── ProductCard.jsx        # Product display component
│       └── CheckoutModal.jsx      # Payment flow component
├── server/
│   └── index.js                   # Express webhook server
├── public/                        # Static assets
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
└── README.md                      # This file
```

## 🎯 How It Works

1. **Browse Products** - User browses the digital product catalog
2. **Add to Cart** - User adds items to their shopping cart
3. **Checkout** - User proceeds to checkout and sees:
   - Total amount in QUBIC
   - Wallet address (with QR code)
   - Payment instructions
4. **Send Payment** - User sends QUBIC from their wallet
5. **EasyConnect Detection** - EasyConnect monitors the blockchain and detects the transaction
6. **Webhook Trigger** - EasyConnect sends a webhook to our server
7. **Real-time Update** - Server notifies the frontend via WebSocket
8. **Order Confirmation** - User sees instant confirmation and receives their digital products

## 🧪 Testing

### Manual Testing

1. Start the application: `npm run dev:all`
2. Add products to cart
3. Click checkout
4. Trigger test payment:
   ```bash
   curl -X POST http://localhost:3001/api/test/trigger-payment \
     -H "Content-Type: application/json" \
     -d '{"amount": 1000}'
   ```
5. Watch the UI update in real-time!

### Production Testing

1. Deploy the backend to a server (Heroku, Railway, etc.)
2. Configure EasyConnect with your production webhook URL
3. Make a real QUBIC transaction
4. Verify the payment is detected and confirmed

## 🎨 Tech Stack

- **Frontend:**
  - React 18
  - Vite
  - Tailwind CSS
  - Lucide Icons
  - QRCode.react
  - Socket.IO Client

- **Backend:**
  - Node.js
  - Express
  - Socket.IO
  - CORS

- **Integration:**
  - EasyConnect (Kairos)
  - Qubic Network

## 📝 Environment Variables

Create a `.env` file for production:

```env
PORT=3001
QUBIC_WALLET_ADDRESS=your_wallet_address
FRONTEND_URL=http://localhost:5173
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy the 'dist' folder
```

### Backend (Railway/Heroku)

```bash
# Ensure package.json has:
"scripts": {
  "start": "node server/index.js"
}
```

## 🏆 Hackathon Submission

This project demonstrates:

- ✅ **EasyConnect Integration** - Real-time blockchain event monitoring
- ✅ **Practical Use Case** - E-commerce with crypto payments
- ✅ **User Experience** - Smooth, modern UI with instant feedback
- ✅ **Innovation** - Bridging Web2 UX with Web3 payments

## 📹 Demo Video

[Link to demo video - to be recorded]

## 🤝 Contributing

This is a hackathon project, but feel free to fork and improve!

## 📄 License

MIT License - Built for Qubic Hack the Future 2025

## 👥 Team

[Your team information]

## 🙏 Acknowledgments

- Qubic Network for the amazing blockchain platform
- EasyConnect (Kairos) for the automation tools
- lablab.ai for hosting the hackathon

---

**Built with ❤️ for Qubic Hack the Future 2025**
