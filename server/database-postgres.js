import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { QX_QUSD_LTV, QX_LIQUIDATION_THRESHOLD, BORROW_APY, SUPPLY_APY, INTEREST_TICK_SECONDS } from './constants.js'

dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Database {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        })

        this.initPromise = this.init()
    }

    async init() {
        try {
            const schemaPath = path.join(__dirname, 'schema.sql')
            const schema = fs.readFileSync(schemaPath, 'utf8')
            await this.pool.query(schema)
            console.log('✅ Database initialized')
        } catch (error) {
            console.error('Failed to initialize database:', error)
        }
    }

    async query(text, params) {
        await this.initPromise
        return this.pool.query(text, params)
    }

    // --- User Methods ---
    async getUser(walletAddress) {
        const res = await this.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress])
        return res.rows[0]
    }

    async createUser(walletAddress) {
        const now = Date.now()
        const res = await this.query(
            'INSERT INTO users (wallet_address, created_at) VALUES ($1, $2) RETURNING *',
            [walletAddress, now]
        )
        return res.rows[0]
    }

    // --- Asset Methods ---
    async getAsset(symbol) {
        const res = await this.query('SELECT * FROM assets WHERE symbol = $1', [symbol])
        return res.rows[0]
    }

    async getAssetById(id) {
        const res = await this.query('SELECT * FROM assets WHERE id = $1', [id])
        return res.rows[0]
    }

    // --- Deposit Methods (Collateral) ---
    async createDeposit(userId, assetId, amount) {
        const now = Date.now()
        const res = await this.query(
            'INSERT INTO deposits (user_id, asset_id, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, assetId, amount, now]
        )
        return res.rows[0]
    }

    async getUserDeposits(userId) {
        const res = await this.query('SELECT * FROM deposits WHERE user_id = $1', [userId])
        return res.rows.map(row => ({ ...row, amount: parseFloat(row.amount) }))
    }

    // --- Supply Methods (Liquidity) ---
    async createSupply(userId, amount) {
        const now = Date.now()

        // Start transaction
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')

            const supplyRes = await client.query(
                'INSERT INTO supplies (user_id, amount, interest_earned, last_accrual_ts, created_at) VALUES ($1, $2, 0, $3, $3) RETURNING *',
                [userId, amount, now]
            )

            // Update liquidity pool
            await client.query(
                'UPDATE liquidity_pool SET total_supplied = total_supplied + $1, available_liquidity = available_liquidity + $1 WHERE id = 1',
                [amount]
            )

            await client.query('COMMIT')
            return { ...supplyRes.rows[0], amount: parseFloat(supplyRes.rows[0].amount) }
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    }

    async getUserSupplies(userId) {
        const res = await this.query('SELECT * FROM supplies WHERE user_id = $1', [userId])
        return res.rows.map(row => ({
            ...row,
            amount: parseFloat(row.amount),
            interest_earned: parseFloat(row.interest_earned),
            last_accrual_ts: parseInt(row.last_accrual_ts)
        }))
    }

    async getAllSupplies() {
        const res = await this.query('SELECT * FROM supplies')
        return res.rows.map(row => ({
            ...row,
            amount: parseFloat(row.amount),
            interest_earned: parseFloat(row.interest_earned),
            last_accrual_ts: parseInt(row.last_accrual_ts)
        }))
    }

    async updateSupply(id, updates) {
        const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')
        const values = [id, ...Object.values(updates)]
        await this.query(`UPDATE supplies SET ${setClause} WHERE id = $1`, values)
    }

    async withdrawSupply(userId, amount) {
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')

            // Get user supplies
            const suppliesRes = await client.query('SELECT * FROM supplies WHERE user_id = $1 ORDER BY created_at ASC', [userId])
            const supplies = suppliesRes.rows.map(s => ({ ...s, amount: parseFloat(s.amount), interest_earned: parseFloat(s.interest_earned) }))

            const totalSupplied = supplies.reduce((sum, s) => sum + s.amount + s.interest_earned, 0)

            if (amount > totalSupplied) throw new Error('Insufficient supply balance')

            // Check liquidity
            const poolRes = await client.query('SELECT available_liquidity FROM liquidity_pool WHERE id = 1')
            const availableLiquidity = parseFloat(poolRes.rows[0].available_liquidity)

            if (amount > availableLiquidity) throw new Error('Insufficient liquidity in pool')

            // Deduct (FIFO)
            let remaining = amount
            for (const supply of supplies) {
                if (remaining <= 0) break

                const supplyTotal = supply.amount + supply.interest_earned
                const deduction = Math.min(remaining, supplyTotal)

                if (deduction >= supplyTotal) {
                    await client.query('DELETE FROM supplies WHERE id = $1', [supply.id])
                } else {
                    if (deduction <= supply.interest_earned) {
                        await client.query('UPDATE supplies SET interest_earned = interest_earned - $1 WHERE id = $2', [deduction, supply.id])
                    } else {
                        const amountDeduction = deduction - supply.interest_earned
                        await client.query('UPDATE supplies SET interest_earned = 0, amount = amount - $1 WHERE id = $2', [amountDeduction, supply.id])
                    }
                }
                remaining -= deduction
            }

            // Update pool
            await client.query('UPDATE liquidity_pool SET total_supplied = total_supplied - $1, available_liquidity = available_liquidity - $1 WHERE id = 1', [amount])

            await client.query('COMMIT')
            return { withdrawn: amount, remaining: totalSupplied - amount }
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    }

    // --- Loan Methods ---
    async createLoan(userId, assetId, amount) {
        const now = Date.now()
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')

            const res = await client.query(
                'INSERT INTO loans (user_id, asset_id, principal, interest_accrued, last_accrual_ts, status, created_at) VALUES ($1, $2, $3, 0, $4, $5, $4) RETURNING *',
                [userId, assetId, amount, now, 'active']
            )

            // Update pool
            await client.query('UPDATE liquidity_pool SET total_borrowed = total_borrowed + $1, available_liquidity = available_liquidity - $1 WHERE id = 1', [amount])

            await client.query('COMMIT')
            return { ...res.rows[0], principal: parseFloat(res.rows[0].principal) }
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    }

    async getUserLoans(userId) {
        const res = await this.query("SELECT * FROM loans WHERE user_id = $1 AND status = 'active'", [userId])
        return res.rows.map(row => ({
            ...row,
            principal: parseFloat(row.principal),
            interest_accrued: parseFloat(row.interest_accrued),
            last_accrual_ts: parseInt(row.last_accrual_ts)
        }))
    }

    async getAllActiveLoans() {
        const res = await this.query("SELECT * FROM loans WHERE status = 'active'")
        return res.rows.map(row => ({
            ...row,
            principal: parseFloat(row.principal),
            interest_accrued: parseFloat(row.interest_accrued),
            last_accrual_ts: parseInt(row.last_accrual_ts)
        }))
    }

    async updateLoan(id, updates) {
        const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')
        const values = [id, ...Object.values(updates)]
        await this.query(`UPDATE loans SET ${setClause} WHERE id = $1`, values)
    }

    // --- Protocol Params & Pool ---
    async getProtocolParams() {
        const res = await this.query('SELECT * FROM protocol_params WHERE id = 1')
        const row = res.rows[0]
        return {
            ...row,
            ltv_ratio: parseFloat(row.ltv_ratio),
            liquidation_threshold: parseFloat(row.liquidation_threshold),
            borrow_apy: parseFloat(row.borrow_apy),
            supply_apy: parseFloat(row.supply_apy)
        }
    }

    async getLiquidityPool() {
        const res = await this.query('SELECT * FROM liquidity_pool WHERE id = 1')
        const row = res.rows[0]
        return {
            ...row,
            total_supplied: parseFloat(row.total_supplied),
            total_borrowed: parseFloat(row.total_borrowed),
            available_liquidity: parseFloat(row.available_liquidity),
            supply_apy: parseFloat(row.supply_apy)
        }
    }

    async updateLiquidityPool(updates) {
        const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ')
        const values = Object.values(updates)
        await this.query(`UPDATE liquidity_pool SET ${setClause} WHERE id = 1`, values)
    }

    // --- Events ---
    async createEvent(userId, type, data) {
        const now = Date.now()
        await this.query(
            'INSERT INTO events (user_id, type, data, timestamp) VALUES ($1, $2, $3, $4)',
            [userId, type, data, now]
        )
    }
}

export default new Database()
