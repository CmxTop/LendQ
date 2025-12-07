import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { QX_QUSD_LTV, QX_LIQUIDATION_THRESHOLD, BORROW_APY, SUPPLY_APY, INTEREST_TICK_SECONDS } from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_FILE = path.join(__dirname, 'lendq_data.json')

// Default database structure
const defaultDB = {
  users: [],
  assets: [
    { id: 1, symbol: 'QX', price_usd: 10.0, decimals: 8 },
    { id: 2, symbol: 'QUSD', price_usd: 1.0, decimals: 8 }
  ],
  deposits: [],  // Collateral deposits (QX)
  supplies: [],  // Liquidity supplies (QUSD)
  loans: [],
  liquidity_pool: {
    total_supplied: 0,
    total_borrowed: 0,
    available_liquidity: 0,
    supply_apy: SUPPLY_APY
  },
  protocol_params: {
    id: 1,
    ltv_ratio: QX_QUSD_LTV,
    liquidation_threshold: QX_LIQUIDATION_THRESHOLD,
    borrow_apy: BORROW_APY,
    supply_apy: SUPPLY_APY,
    tick_seconds: INTEREST_TICK_SECONDS
  },
  events: [],
  counters: {
    users: 0,
    deposits: 0,
    supplies: 0,
    loans: 0,
    events: 0
  }
}

class JSONDatabase {
  constructor() {
    this.initDatabase()
  }

  initDatabase() {
    if (!fs.existsSync(DB_FILE)) {
      this.saveDB(defaultDB)
      console.log('✅ Database initialized')
    } else {
      console.log('✅ Database loaded')
    }
  }

  loadDB() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error loading database:', error)
      return defaultDB
    }
  }

  saveDB(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error saving database:', error)
    }
  }

  // Users
  createUser(walletAddress) {
    const db = this.loadDB()
    const user = {
      id: ++db.counters.users,
      wallet_address: walletAddress,
      created_at: Date.now()
    }
    db.users.push(user)
    this.saveDB(db)
    return user
  }

  findUserByAddress(walletAddress) {
    const db = this.loadDB()
    return db.users.find(u => u.wallet_address === walletAddress)
  }

  // Assets
  getAssets() {
    const db = this.loadDB()
    return db.assets
  }

  getAssetBySymbol(symbol) {
    const db = this.loadDB()
    return db.assets.find(a => a.symbol === symbol)
  }

  updateAssetPrice(symbol, price) {
    const db = this.loadDB()
    const asset = db.assets.find(a => a.symbol === symbol)
    if (asset) {
      asset.price_usd = price
      this.saveDB(db)
    }
    return asset
  }

  // Deposits
  createDeposit(userId, assetId, amount) {
    const db = this.loadDB()
    const deposit = {
      id: ++db.counters.deposits,
      user_id: userId,
      asset_id: assetId,
      amount,
      created_at: Date.now()
    }
    db.deposits.push(deposit)
    this.saveDB(db)
    return deposit
  }

  getUserDeposits(userId, assetId) {
    const db = this.loadDB()
    return db.deposits.filter(d => d.user_id === userId && d.asset_id === assetId)
  }

  // Loans
  createLoan(userId, assetId, principal) {
    const db = this.loadDB()
    const now = Date.now()
    const loan = {
      id: ++db.counters.loans,
      user_id: userId,
      asset_id: assetId,
      principal,
      interest_accrued: 0,
      last_accrual_ts: now,
      status: 'active',
      created_at: now
    }
    db.loans.push(loan)
    this.saveDB(db)
    return loan
  }

  getUserLoans(userId, status = 'active') {
    const db = this.loadDB()
    return db.loans.filter(l => l.user_id === userId && l.status === status)
  }

  getAllActiveLoans() {
    const db = this.loadDB()
    return db.loans.filter(l => l.status === 'active')
  }

  updateLoan(loanId, updates) {
    const db = this.loadDB()
    const loan = db.loans.find(l => l.id === loanId)
    if (loan) {
      Object.assign(loan, updates)
      this.saveDB(db)
    }
    return loan
  }

  updateLoansForUser(userId, updates) {
    const db = this.loadDB()
    const loans = db.loans.filter(l => l.user_id === userId && l.status === 'active')
    loans.forEach(loan => Object.assign(loan, updates))
    this.saveDB(db)
  }

  // Supplies (Liquidity Pool)
  createSupply(userId, amount) {
    const db = this.loadDB()
    const now = Date.now()
    const supply = {
      id: ++db.counters.supplies,
      user_id: userId,
      amount,
      interest_earned: 0,
      last_accrual_ts: now,
      created_at: now
    }
    db.supplies.push(supply)

    // Update liquidity pool
    db.liquidity_pool.total_supplied += amount
    db.liquidity_pool.available_liquidity += amount

    this.saveDB(db)
    return supply
  }

  getUserSupplies(userId) {
    const db = this.loadDB()
    return db.supplies.filter(s => s.user_id === userId)
  }

  getAllSupplies() {
    const db = this.loadDB()
    return db.supplies
  }

  updateSupply(supplyId, updates) {
    const db = this.loadDB()
    const supply = db.supplies.find(s => s.id === supplyId)
    if (supply) {
      Object.assign(supply, updates)
      this.saveDB(db)
    }
    return supply
  }

  withdrawSupply(userId, amount) {
    const db = this.loadDB()
    const supplies = this.getUserSupplies(userId)
    const totalSupplied = supplies.reduce((sum, s) => sum + s.amount + s.interest_earned, 0)

    if (amount > totalSupplied) {
      throw new Error('Insufficient supply balance')
    }

    if (amount > db.liquidity_pool.available_liquidity) {
      throw new Error('Insufficient liquidity in pool')
    }

    // Deduct from supplies (FIFO)
    let remaining = amount
    for (const supply of supplies) {
      if (remaining <= 0) break

      const supplyTotal = supply.amount + supply.interest_earned
      const deduction = Math.min(remaining, supplyTotal)

      if (deduction >= supplyTotal) {
        // Remove supply entirely
        const index = db.supplies.findIndex(s => s.id === supply.id)
        db.supplies.splice(index, 1)
      } else {
        // Reduce supply amount
        if (deduction <= supply.interest_earned) {
          supply.interest_earned -= deduction
        } else {
          const amountDeduction = deduction - supply.interest_earned
          supply.interest_earned = 0
          supply.amount -= amountDeduction
        }
      }

      remaining -= deduction
    }

    // Update liquidity pool
    db.liquidity_pool.total_supplied -= amount
    db.liquidity_pool.available_liquidity -= amount

    this.saveDB(db)
    return { withdrawn: amount, remaining: totalSupplied - amount }
  }

  getLiquidityPool() {
    const db = this.loadDB()
    return db.liquidity_pool
  }

  updateLiquidityPool(updates) {
    const db = this.loadDB()
    Object.assign(db.liquidity_pool, updates)
    this.saveDB(db)
  }

  // Protocol params
  getProtocolParams() {
    const db = this.loadDB()
    return db.protocol_params
  }

  updateProtocolParams(params) {
    const db = this.loadDB()
    Object.assign(db.protocol_params, params)
    this.saveDB(db)
    return db.protocol_params
  }

  // Events
  createEvent(userId, type, metadata) {
    const db = this.loadDB()
    const event = {
      id: ++db.counters.events,
      user_id: userId,
      type,
      metadata: JSON.stringify(metadata),
      created_at: Date.now()
    }
    db.events.push(event)
    this.saveDB(db)
    return event
  }

  getEvents(limit = 100) {
    const db = this.loadDB()
    return db.events.slice(-limit).reverse()
  }
}

const db = new JSONDatabase()
export default db
