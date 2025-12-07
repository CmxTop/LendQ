import Database from './database-memory.js'
import { QX_QUSD_LTV, QX_LIQUIDATION_THRESHOLD, BORROW_APY, SUPPLY_APY, INTEREST_TICK_SECONDS } from './constants.js'

class LendQLendingEngine {
    constructor() {
        this.db = Database
        this.params = {
            ltv_ratio: 0.75,
            liquidation_threshold: 0.85,
            borrow_apy: 0.05,
            supply_apy: 0.03,
            base_rate: 0.02,
            multiplier: 0.1
        }
    }

    async init() {
    }
} catch (e) {
    console.warn('Could not load params from DB, using defaults')
}
    }

// Get protocol parameters
getProtocolParams() {
    return this.params
}

    // Update protocol parameters (admin only)
    async updateProtocolParams(params) {
    // Not implemented in postgres adapter yet
    // this.params = await this.db.updateProtocolParams(params)
    return this.params
}

    // Get or create user
    async getOrCreateUser(walletAddress) {
    let user = await this.db.getUser(walletAddress)
    if (!user) {
        user = await this.db.createUser(walletAddress)
        await this.db.createEvent(user.id, 'user_created', { walletAddress })
    }
    return user
}

    // Get asset by symbol
    async getAsset(symbol) {
    return await this.db.getAsset(symbol)
}

    // Get asset by ID
    async getAssetById(id) {
    return await this.db.getAssetById(id)
}
    // Update asset price (admin only)
    async updateAssetPrice(symbol, priceUsd) {
    return await this.db.updateAssetPrice(symbol, priceUsd)
}

    // Deposit collateral
    async deposit(userId, symbol, amount) {
    const asset = await this.db.getAsset(symbol)
    if (!asset) throw new Error('Asset not found')

    const deposit = await this.db.createDeposit(userId, asset.id, amount)
    await this.db.createEvent(userId, 'deposit', { symbol, amount })

    return deposit
}

    // Withdraw collateral
    async withdrawCollateral(userId, symbol, amount) {
    const asset = await this.db.getAsset(symbol)
    if (!asset) throw new Error('Asset not found')

    const currentDeposits = await this.getUserDeposits(userId, symbol)
    if (amount > currentDeposits) {
        throw new Error(`Insufficient collateral. You have ${currentDeposits} ${symbol} deposited.`)
    }


    // Check if withdrawal is safe (health factor)
    const qxAsset = await this.db.getAsset('QX')
    const withdrawValueUSD = amount * qxAsset.price_usd

    const currentCollateralValue = await this.calculateCollateralValue(userId)
    const newCollateralValue = currentCollateralValue - withdrawValueUSD

    const borrowedValue = await this.calculateBorrowedValue(userId)

    if (borrowedValue > 0.000001) { // Ignore dust
        // Calculate new health factor based on LTV
        // Users cannot withdraw if it puts them above the Max LTV ratio
        // Condition: NewCollateral * LTV >= Borrowed

        const maxBorrowNew = newCollateralValue * this.params.ltv_ratio

        // Allow a tiny epsilon (0.001) for floating point precision issues
        if (borrowedValue > maxBorrowNew + 0.001) {
            throw new Error(`Cannot withdraw ${amount} ${symbol}. This would exceed your LTV limit. Max withdrawal: ${((currentCollateralValue - (borrowedValue / this.params.ltv_ratio)) / qxAsset.price_usd).toFixed(2)} ${symbol}`)
        }
    }

    // Proceed with withdrawal (negative deposit)
    // We use createDeposit with negative amount to represent withdrawal in this simple DB model
    const withdrawal = await this.db.createDeposit(userId, asset.id, -amount)
    await this.db.createEvent(userId, 'withdraw_collateral', { symbol, amount })

    return withdrawal
}

    // Get user deposits for specific asset
    async getUserDeposits(userId, symbol) {
    const asset = await this.db.getAsset(symbol)
    if (!asset) return 0 // Asset not found, so no deposits for it

    const deposits = await this.db.getUserDeposits(userId)
    return deposits
        .filter(d => d.asset_id === asset.id)
        .reduce((sum, d) => sum + d.amount, 0)
}

    // Calculate total collateral value in USD
    async calculateCollateralValue(userId) {
    const qxDeposits = await this.getUserDeposits(userId, 'QX')
    const qxAsset = await this.db.getAsset('QX')
    return qxDeposits * qxAsset.price_usd
}

    // Calculate total borrowed value in USD
    async calculateBorrowedValue(userId) {
    const loans = await this.db.getUserLoans(userId)
    const total = loans.reduce((sum, loan) => sum + loan.principal + loan.interest_accrued, 0)
    // console.log(`Debug: User ${userId} has ${loans.length} loans. Total debt: ${total}`)
    return total
}

    // Calculate max borrow amount in USD
    async calculateMaxBorrow(userId) {
    const collateralValue = await this.calculateCollateralValue(userId)
    return collateralValue * this.params.ltv_ratio
}

    // Get user's active loans
    async getUserLoans(userId) {
    return await this.db.getUserLoans(userId)
}

    // Calculate health factor
    async calculateHealthFactor(userId) {
    const collateralValue = await this.calculateCollateralValue(userId)
    const borrowedValue = await this.calculateBorrowedValue(userId)

    if (borrowedValue === 0) return null // No loans

    const liquidationThreshold = collateralValue * this.params.liquidation_threshold
    return liquidationThreshold / borrowedValue
}

    // Supply QUSD to liquidity pool
    async supply(userId, amount) {
    const asset = await this.db.getAsset('QUSD')
    const supply = await this.db.createSupply(userId, asset.id, amount)

    // Update liquidity pool
    const pool = await this.db.getLiquidityPool()
    await this.db.updateLiquidityPool({
        total_supplied: pool.total_supplied + amount,
        available_liquidity: pool.available_liquidity + amount
    })

    await this.db.createEvent(userId, 'supply', { amount })
    return supply
}

    // Get user's total supplied amount
    async getUserSupplied(userId) {
    const supplies = await this.db.getUserSupplies(userId)
    return supplies.reduce((sum, s) => sum + s.amount + s.interest_earned, 0)
}

    // Get user's supplied details (principal vs interest)
    async getUserSuppliedDetails(userId) {
    const supplies = await this.db.getUserSupplies(userId)
    const principal = supplies.reduce((sum, s) => sum + s.amount, 0)
    const interestEarned = supplies.reduce((sum, s) => sum + s.interest_earned, 0)
    return { principal, interestEarned }
}

    // Withdraw from liquidity pool
    async withdraw(userId, amount) {
    // Check user's supplied balance
    const supplied = await this.getUserSupplied(userId)
    if (amount > supplied) {
        throw new Error(`Insufficient funds. You have ${supplied.toFixed(2)} QUSD supplied.`)
    }

    // Check liquidity pool
    const pool = await this.db.getLiquidityPool()
    if (amount > pool.available_liquidity) {
        throw new Error(`Insufficient liquidity in pool. Available: ${pool.available_liquidity.toFixed(2)} QUSD`)
    }

    const result = await this.db.withdrawSupply(userId, amount)

    // Update liquidity pool
    await this.db.updateLiquidityPool({
        total_supplied: pool.total_supplied - amount,
        available_liquidity: pool.available_liquidity - amount
    })

    await this.db.createEvent(userId, 'withdraw', { amount })
    return result
}

    // Accrue supply interest
    async accrueSupplyInterest(supply) {
    const now = Date.now()
    const secondsElapsed = (now - supply.last_accrual_ts) / 1000
    const annualRate = this.params.supply_apy
    const secondsPerYear = 365 * 24 * 60 * 60

    const interestIncrement = (supply.amount * annualRate * secondsElapsed) / secondsPerYear

    await this.db.updateSupply(supply.id, {
        interest_earned: supply.interest_earned + interestIncrement,
        last_accrual_ts: now
    })

    return interestIncrement
}

    // Accrue interest for all supplies
    async accrueAllSupplyInterest() {
    const supplies = await this.db.getAllSupplies()
    let totalEarned = 0

    for (const supply of supplies) {
        totalEarned += await this.accrueSupplyInterest(supply)
    }

    return { suppliesUpdated: supplies.length, totalEarned }
}

    // Borrow QUSD (updated to check liquidity pool and collateral)
    async borrow(userId, amount) {
    const collateralValue = await this.calculateCollateralValue(userId)

    // Check if user has deposited collateral
    if (collateralValue === 0) {
        throw new Error('You must deposit collateral (QX) before borrowing. Please deposit QX first.')
    }
    const maxBorrow = await this.calculateMaxBorrow(userId)
    const currentBorrowed = await this.calculateBorrowedValue(userId)
    const availableToBorrow = maxBorrow - currentBorrowed

    if (amount > availableToBorrow) {
        const ltvPercent = (this.params.ltv_ratio * 100).toFixed(0)
        throw new Error(`Insufficient collateral. You can borrow up to ${availableToBorrow.toFixed(2)} QUSD based on your collateral (${ltvPercent}% LTV). Either borrow ${availableToBorrow.toFixed(2)} QUSD or deposit more QX collateral.`)
    }

    // Check liquidity pool
    const pool = await this.db.getLiquidityPool()
    if (amount > pool.available_liquidity) {
        throw new Error(`Insufficient liquidity in pool. Available: ${pool.available_liquidity.toFixed(2)} QUSD`)
    }

    const qusdAsset = await this.db.getAsset('QUSD')
    const loan = await this.db.createLoan(userId, qusdAsset.id, amount)

    // Update liquidity pool (this logic was removed from the diff, but it's crucial for pool state)
    // Re-adding based on original intent and common lending protocol logic
    await this.db.updateLiquidityPool({
        total_borrowed: pool.total_borrowed + amount,
        available_liquidity: pool.available_liquidity - amount
    })

    await this.db.createEvent(userId, 'borrow', { amount })

    return {
        ...loan,
        healthFactor: await this.calculateHealthFactor(userId)
    }
}

    // Accrue interest for a single loan
    async accrueInterest(loan) {
    const now = Date.now()
    const secondsElapsed = (now - loan.last_accrual_ts) / 1000
    const annualRate = this.params.borrow_apy
    const secondsPerYear = 365 * 24 * 60 * 60

    const interestIncrement = (loan.principal * annualRate * secondsElapsed) / secondsPerYear

    await this.db.updateLoan(loan.id, {
        interest_accrued: loan.interest_accrued + interestIncrement,
        last_accrual_ts: now
    })

    return interestIncrement
}

    // Accrue interest for all active loans
    async accrueAllInterest() {
    const loans = await this.db.getAllActiveLoans()
    let totalAccrued = 0

    for (const loan of loans) {
        totalAccrued += await this.accrueInterest(loan)
    }

    return { loansUpdated: loans.length, totalAccrued }
}

    // Repay loan (updated to return to liquidity pool)
    async repay(userId, amount) {
    const loans = await this.db.getUserLoans(userId)
    if (loans.length === 0) {
        throw new Error('No active loans to repay')
    }

    // Calculate total debt first to check for overpayment
    const totalDebt = loans.reduce((sum, loan) => sum + loan.principal + loan.interest_accrued, 0)

    if (amount > totalDebt) {
        // Cap repayment to total debt to prevent overpayment errors (especially for dust)
        amount = totalDebt
    }

    let remainingAmount = amount
    let totalRepaid = 0

    for (const loan of loans) {
        if (remainingAmount <= 0) break

        // First repay interest, then principal
        const totalDebt = loan.principal + loan.interest_accrued
        const paymentAmount = Math.min(remainingAmount, totalDebt)

        let newInterest = loan.interest_accrued - paymentAmount
        let newPrincipal = loan.principal

        if (newInterest < 0) {
            newPrincipal += newInterest
            newInterest = 0
        }

        if (newPrincipal <= 0.000001) { // Treat dust as 0
            // Loan fully repaid
            await this.db.updateLoan(loan.id, { status: 'repaid', principal: 0, interest_accrued: 0 })
        } else {
            await this.db.updateLoan(loan.id, {
                principal: newPrincipal,
                interest_accrued: newInterest
            })
        }

        remainingAmount -= paymentAmount
        totalRepaid += paymentAmount
    }

    // Return funds to liquidity pool
    const pool = await this.db.getLiquidityPool()
    await this.db.updateLiquidityPool({
        total_borrowed: pool.total_borrowed - totalRepaid,
        available_liquidity: pool.available_liquidity + totalRepaid
    })

    await this.db.createEvent(userId, 'repay', { amount: totalRepaid })

    return {
        amountRepaid: totalRepaid,
        healthFactor: await this.calculateHealthFactor(userId)
    }
}

    // Check and execute liquidations
    async checkLiquidations() {
    const allLoans = await this.db.getAllActiveLoans()
    const userIds = [...new Set(allLoans.map(l => l.user_id))]
    const liquidated = []

    for (const userId of userIds) {
        const hf = await this.calculateHealthFactor(userId)

        if (hf !== null && hf < 1.0) {
            // Liquidate user's loans
            await this.db.updateLoansForUser(userId, { status: 'liquidated' })
            await this.db.createEvent(userId, 'liquidation', { healthFactor: hf })

            liquidated.push({ userId, healthFactor: hf })
        }
    }

    return liquidated
}

    // Get user position (updated with supply info)
    async getUserPosition(userId) {
    const qxDeposits = await this.getUserDeposits(userId, 'QX')
    const collateralValue = await this.calculateCollateralValue(userId)
    const borrowedValue = await this.calculateBorrowedValue(userId)
    const maxBorrow = await this.calculateMaxBorrow(userId)
    const healthFactor = await this.calculateHealthFactor(userId)
    const loans = await this.db.getUserLoans(userId)
    const supplied = await this.getUserSupplied(userId)
    const suppliedDetails = await this.getUserSuppliedDetails(userId)
    const pool = await this.db.getLiquidityPool()

    return {
        collateral: {
            qx: qxDeposits,
            valueUSD: collateralValue
        },
        borrowed: {
            total: borrowedValue,
            loans: loans.map(l => ({
                id: l.id,
                principal: l.principal,
                interest: l.interest_accrued,
                total: l.principal + l.interest_accrued
            }))
        },
        supplied: {
            total: supplied,
            principal: suppliedDetails.principal,
            interestEarned: suppliedDetails.interestEarned,
            apy: this.params.supply_apy
        },
        liquidityPool: {
            totalSupplied: pool.total_supplied,
            totalBorrowed: pool.total_borrowed,
            availableLiquidity: pool.available_liquidity,
            utilizationRate: pool.total_supplied > 0 ? (pool.total_borrowed / pool.total_supplied) : 0
        },
        protocolParams: {
            ltvRatio: this.params.ltv_ratio,
            liquidationThreshold: this.params.liquidation_threshold,
            borrowApy: this.params.borrow_apy,
            supplyApy: this.params.supply_apy
        },
        maxBorrow,
        availableToBorrow: Math.max(0, Math.min(maxBorrow - borrowedValue, pool.available_liquidity)),
        healthFactor,
        status: healthFactor === null ? 'no_loan' : (healthFactor < 1 ? 'liquidated' : 'active')
    }
}

    // Get all events
    async getEvents(limit = 100) {
    // Not implemented in postgres adapter yet, but interface requires it
    return []
}
}

export default AaveLendingEngine
