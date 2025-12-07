
class Database {
    constructor() {
        this.users = []
        this.loans = []
        this.deposits = []
        this.supplies = []
        this.events = []
        this.assets = [
            { id: 1, symbol: 'QX', name: 'Qubic', price_usd: 10.0, decimals: 18 },
            { id: 2, symbol: 'QUSD', name: 'Qubic Dollar', price_usd: 1.0, decimals: 18 }
        ]
        this.protocolParams = {
            ltv_ratio: 0.75,
            liquidation_threshold: 0.85,
            borrow_apy: 0.05,
            supply_apy: 0.03,
            tick_seconds: 60
        }
        this.pool = {
            total_supplied: 1000000,
            total_borrowed: 0,
            available_liquidity: 1000000,
            utilization_rate: 0
        }
    }

    async init() {
        console.log('✅ In-Memory Database initialized')
    }

    async getUser(walletAddress) {
        return this.users.find(u => u.wallet_address === walletAddress)
    }

    async createUser(walletAddress) {
        const user = { id: this.users.length + 1, wallet_address: walletAddress, created_at: new Date() }
        this.users.push(user)
        return user
    }

    async getAsset(symbol) {
        return this.assets.find(a => a.symbol === symbol)
    }

    async getAssetById(id) {
        return this.assets.find(a => a.id === id)
    }

    async getUserDeposits(userId) {
        return this.deposits.filter(d => d.user_id === userId)
    }

    async createDeposit(userId, assetId, amount) {
        const deposit = { id: this.deposits.length + 1, user_id: userId, asset_id: assetId, amount, timestamp: new Date() }
        this.deposits.push(deposit)
        return deposit
    }

    async getUserLoans(userId) {
        const loans = this.loans.filter(l => l.user_id === userId && l.status === 'active')
        // Ensure numeric values are returned, handling potential nulls
        return loans.map(l => ({
            ...l,
            principal: parseFloat(l.principal || 0),
            interest_accrued: parseFloat(l.interest_accrued || 0)
        }))
    }

    async getAllActiveLoans() {
        return this.loans.filter(l => l.status === 'active')
    }

    async createLoan(userId, assetId, amount) {
        const loan = {
            id: this.loans.length + 1,
            user_id: userId,
            asset_id: assetId,
            principal: amount,
            interest_accrued: 0,
            status: 'active',
            start_date: new Date(),
            last_accrual_ts: new Date()
        }
        this.loans.push(loan)
        return loan
    }

    async updateLoanInterest(loanId, interest) {
        const loan = this.loans.find(l => l.id === loanId)
        if (loan) {
            loan.interest_accrued += interest
            loan.last_accrual_ts = new Date()
        }
    }

    async updateLoan(loanId, updates) {
        const loan = this.loans.find(l => l.id === loanId)
        if (loan) {
            Object.assign(loan, updates)
        }
        return loan
    }

    async updateLoansForUser(userId, updates) {
        const userLoans = this.loans.filter(l => l.user_id === userId && l.status === 'active')
        for (const loan of userLoans) {
            Object.assign(loan, updates)
        }
    }

    async repayLoan(loanId) {
        const loan = this.loans.find(l => l.id === loanId)
        if (loan) {
            loan.status = 'repaid'
        }
    }

    async getLiquidityPool() {
        return this.pool
    }

    async updateLiquidityPool(updates) {
        this.pool = { ...this.pool, ...updates }
        return this.pool
    }

    async getProtocolParams() {
        return this.protocolParams
    }

    async createEvent(userId, type, data) {
        const event = { id: this.events.length + 1, user_id: userId, type, data, timestamp: new Date() }
        this.events.push(event)
        return event
    }

    // Supply methods
    async getUserSupplies(userId) {
        return this.supplies.filter(s => s.user_id === userId)
    }

    async createSupply(userId, assetId, amount) {
        const supply = {
            id: this.supplies.length + 1,
            user_id: userId,
            asset_id: assetId,
            amount,
            interest_earned: 0,
            timestamp: new Date()
        }
        this.supplies.push(supply)
        return supply
    }

    async withdrawSupply(userId, amount) {
        // Find QUSD asset ID (usually 2)
        const asset = await this.getAsset('QUSD')
        if (!asset) throw new Error('QUSD asset not found')

        // Create a negative supply to represent withdrawal
        const supply = {
            id: this.supplies.length + 1,
            user_id: userId,
            asset_id: asset.id,
            amount: -amount, // Negative amount for withdrawal
            interest_earned: 0,
            timestamp: new Date()
        }
        this.supplies.push(supply)
        return supply
    }

    async getAllSupplies() {
        return this.supplies
    }

    async updateSupplyInterest(supplyId, interest) {
        const supply = this.supplies.find(s => s.id === supplyId)
        if (supply) {
            supply.interest_earned += interest
        }
    }

    async updateSupply(supplyId, updates) {
        const supply = this.supplies.find(s => s.id === supplyId)
        if (supply) {
            Object.assign(supply, updates)
        }
        return supply
    }
}

export default new Database()
