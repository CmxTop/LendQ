// Interest Accrual Worker - Background process for updating loan interest

// import db from './database-postgres.js'
import LendingEngine from './lendingEngine.js'
import { INTEREST_TICK_SECONDS } from './constants.js'

class InterestWorker {
    constructor() {
        this.lendingEngine = new LendingEngine()
        this.isRunning = false
    }

    async run() {
        if (this.isRunning) return
        this.isRunning = true

        try {
            // Accrue loan interest
            const result = await this.lendingEngine.accrueAllInterest()
            if (result.loansUpdated > 0) {
                console.log(`🔄 Accrued interest for ${result.loansUpdated} loans`)
            }

            // Accrue supply interest
            const supplyResult = await this.lendingEngine.accrueAllSupplyInterest()
            if (supplyResult.suppliesUpdated > 0) {
                // console.log(`🔄 Accrued supply interest for ${supplyResult.suppliesUpdated} positions`)
            }

            // Check liquidations
            const liquidations = await this.lendingEngine.checkLiquidations()
            if (liquidations.length > 0) {
                console.log(`⚠️ Liquidated ${liquidations.length} positions`)
            }

        } catch (error) {
            console.error('Error in interest worker:', error)
        } finally {
            this.isRunning = false
        }
    }

    start() {
        console.log(`⏱️ Interest worker started (Tick: ${INTEREST_TICK_SECONDS}s)`)
        setInterval(() => this.run(), INTEREST_TICK_SECONDS * 1000)
    }
}

// Start the worker
// Note: In index.js we import this file to start the worker, so we instantiate and start it here
const worker = new InterestWorker()
worker.start()

export default worker
