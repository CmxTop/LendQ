import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import LendQLendingEngine from './lendingEngine.js'
import Database from './database-memory.js'
import './interestWorker.js' // Starts the worker automatically


const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for hackathon
        methods: ["GET", "POST"]
    }
})

const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Lending Engine
const lendingEngine = new LendQLendingEngine()

// Helper to broadcast updates
const broadcastUpdate = (event, data) => {
    io.emit(event, data)
}

// Start server
const startServer = async () => {
    await lendingEngine.init()

    // Interest accrual worker
    setInterval(async () => {
        try {
            const result = await lendingEngine.accrueAllInterest()
            if (result.loansUpdated > 0) {
                console.log(`🔄 Accrued interest for ${result.loansUpdated} loans`)
                io.emit('interest-accrued', result)
            }

            // Also accrue supply interest
            const supplyResult = await lendingEngine.accrueAllSupplyInterest()
            if (supplyResult.suppliesUpdated > 0) {
                io.emit('supply-interest-accrued', supplyResult)
            }
        } catch (e) {
            console.error('Error in interest worker:', e)
        }
    }, 60000) // Run every minute

    const PORT = process.env.PORT || 3001
    httpServer.listen(PORT, () => {
        console.log(`
🚀 LendQ Aave-Style Lending Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌐 API: http://localhost:${PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 User Endpoints:
   POST /api/user
   GET  /api/user/:walletAddress/position
   POST /api/deposit
   POST /api/borrow
   POST /api/repay

🔧 Admin Endpoints:
   GET  /api/admin/loans
   POST /api/admin/asset/price
   POST /api/admin/params
   POST /api/admin/accrue

📊 Protocol Parameters:
   LTV Ratio: ${(lendingEngine.params.ltv_ratio * 100).toFixed(0)}%
   Liquidation Threshold: ${(lendingEngine.params.liquidation_threshold * 100).toFixed(0)}%
   Borrow APY: ${(lendingEngine.params.borrow_apy * 100).toFixed(0)}%
   Tick Interval: ${lendingEngine.params.tick_seconds}s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)
    })
}

startServer()

// ============================================
// USER ENDPOINTS
// ============================================

// Get or create user
app.post('/api/user', (req, res) => {
    try {
        const { walletAddress } = req.body
        if (!walletAddress) {
            return res.status(400).json({ success: false, message: 'Wallet address required' })
        }

        const user = lendingEngine.getOrCreateUser(walletAddress)
        res.json({ success: true, user })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get user position
app.get('/api/user/:walletAddress/position', async (req, res) => {
    try {
        const { walletAddress } = req.params
        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const position = await lendingEngine.getUserPosition(user.id)

        res.json(position)
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// ============================================
// ASSET ENDPOINTS
// ============================================

// Get all assets
app.get('/api/assets', async (req, res) => {
    try {
        const assets = [
            await lendingEngine.getAsset('QX'),
            await lendingEngine.getAsset('QUSD')
        ]
        res.json(assets)
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// ============================================
// DEPOSIT ENDPOINTS
// ============================================

// Deposit collateral
app.post('/api/deposit', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body

        if (!walletAddress || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const deposit = await lendingEngine.deposit(user.id, 'QX', parseFloat(amount))
        const position = await lendingEngine.getUserPosition(user.id)

        io.emit('deposit-made', { walletAddress, amount, position })

        res.json({
            success: true,
            message: `Deposited ${amount} QX`,
            deposit,
            position
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Withdraw collateral
app.post('/api/withdraw-collateral', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body

        if (!walletAddress || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const withdrawal = await lendingEngine.withdrawCollateral(user.id, 'QX', parseFloat(amount))
        const position = await lendingEngine.getUserPosition(user.id)

        io.emit('deposit-made', { walletAddress, amount: -amount, position }) // Re-use deposit event or create new one

        res.json({
            success: true,
            message: `Withdrew ${amount} QX`,
            withdrawal,
            position
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// ============================================
// BORROW ENDPOINTS
// ============================================

// Borrow QUSD
app.post('/api/borrow', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body

        if (!walletAddress || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const loan = await lendingEngine.borrow(user.id, parseFloat(amount))
        const position = await lendingEngine.getUserPosition(user.id)

        io.emit('loan-created', { walletAddress, amount, position })

        res.json({
            success: true,
            message: `Borrowed ${amount} QUSD`,
            loan,
            position
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// ============================================
// REPAY ENDPOINTS
// ============================================

// Repay loan
app.post('/api/repay', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body

        if (!walletAddress || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const result = await lendingEngine.repay(user.id, parseFloat(amount))
        const position = await lendingEngine.getUserPosition(user.id)

        io.emit('repayment-made', { walletAddress, amount, position })

        res.json({
            success: true,
            message: `Repaid ${result.amountRepaid.toFixed(2)} QUSD`,
            result,
            position
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// ============================================
// LIQUIDITY POOL ENDPOINTS
// ============================================

// Supply QUSD to liquidity pool
app.post('/api/supply', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body

        if (!walletAddress || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const supply = await lendingEngine.supply(user.id, parseFloat(amount))
        const position = await lendingEngine.getUserPosition(user.id)

        io.emit('supply-made', { walletAddress, amount, position })

        res.json({
            success: true,
            message: `Supplied ${amount} QUSD to liquidity pool`,
            supply,
            position
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// Withdraw from liquidity pool
app.post('/api/withdraw', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body

        if (!walletAddress || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const user = await lendingEngine.getOrCreateUser(walletAddress)
        const result = await lendingEngine.withdraw(user.id, parseFloat(amount))
        const position = await lendingEngine.getUserPosition(user.id)

        io.emit('withdrawal-made', { walletAddress, amount, position })

        res.json({
            success: true,
            message: `Withdrawn ${amount} QUSD from pool`,
            result,
            position
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all loans (admin)
app.get('/api/admin/loans', async (req, res) => {
    try {
        const loans = await lendingEngine.getUserLoans()
        res.json(loans)
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update asset price (admin)
app.post('/api/admin/asset/price', async (req, res) => {
    try {
        const { symbol, price } = req.body

        if (!symbol || !price || price <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid request' })
        }

        const asset = await lendingEngine.updateAssetPrice(symbol, parseFloat(price))

        io.emit('price-updated', { symbol, price })

        res.json({
            success: true,
            message: `Updated ${symbol} price to $${price}`,
            asset
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update protocol params (admin)
app.post('/api/admin/params', async (req, res) => {
    try {
        const { ltv_ratio, liquidation_threshold, borrow_apy, tick_seconds } = req.body

        const params = await lendingEngine.updateProtocolParams({
            ltv_ratio: parseFloat(ltv_ratio),
            liquidation_threshold: parseFloat(liquidation_threshold),
            borrow_apy: parseFloat(borrow_apy),
            tick_seconds: parseInt(tick_seconds)
        })

        io.emit('params-updated', params)

        res.json({
            success: true,
            message: 'Protocol parameters updated',
            params
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get protocol params
app.get('/api/params', (req, res) => {
    try {
        const params = lendingEngine.getProtocolParams()
        res.json(params)
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Trigger manual interest accrual (admin)
app.post('/api/admin/accrue', async (req, res) => {
    try {
        const result = await lendingEngine.accrueAllInterest()
        res.json({
            success: true,
            message: 'Interest accrued',
            result
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get events
app.get('/api/events', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100
        const events = lendingEngine.getEvents(limit)
        res.json(events)
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// ============================================
// WEBSOCKET
// ============================================

io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id)

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id)
    })
})

// ============================================
// START SERVER
// ============================================

// Server start logic moved to startServer() function

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⏹️  Shutting down gracefully...')
    httpServer.close(() => {
        console.log('👋 Server closed')
        process.exit(0)
    })
})
