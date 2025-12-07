// P2P Loan Manager - Manages peer-to-peer lending marketplace

export default class P2PLoanManager {
    constructor() {
        this.loans = new Map()
        this.loanCounter = 0
    }

    /**
     * Create a new loan request
     */
    createLoan(data) {
        const loan = {
            id: `LOAN_${++this.loanCounter}`,
            borrowerAddress: data.borrowerAddress,
            lenderAddress: null,
            amount: data.amount,
            interestRate: data.interestRate,
            duration: data.duration,
            purpose: data.purpose,
            status: 'pending', // pending | active | repaid | defaulted
            createdAt: Date.now(),
            fundedAt: null,
            dueDate: null,
            repayments: [],
            totalRepaid: 0,
            interestAccrued: 0
        }

        this.loans.set(loan.id, loan)
        console.log(`📝 Loan created: ${loan.id} - ${loan.amount} QUSD @ ${loan.interestRate}%`)
        return loan
    }

    /**
     * Get all loans, optionally filtered by status
     */
    getAllLoans(status = null) {
        const allLoans = Array.from(this.loans.values())
        if (status) {
            return allLoans.filter(l => l.status === status)
        }
        return allLoans
    }

    /**
     * Get loans for a specific user
     * @param {string} address - User's wallet address
     * @param {string} role - 'borrower' or 'lender'
     */
    getUserLoans(address, role = 'borrower') {
        const allLoans = Array.from(this.loans.values())

        if (role === 'borrower') {
            return allLoans.filter(l => l.borrowerAddress === address)
        } else if (role === 'lender') {
            return allLoans.filter(l => l.lenderAddress === address)
        }

        return []
    }

    /**
     * Get a specific loan by ID
     */
    getLoan(loanId) {
        return this.loans.get(loanId)
    }

    /**
     * Fund a loan (lender provides capital)
     */
    fundLoan(loanId, lenderAddress) {
        const loan = this.loans.get(loanId)

        if (!loan) {
            throw new Error('Loan not found')
        }

        if (loan.status !== 'pending') {
            throw new Error('Loan is not available for funding')
        }

        if (loan.borrowerAddress === lenderAddress) {
            throw new Error('Cannot fund your own loan')
        }

        loan.lenderAddress = lenderAddress
        loan.status = 'active'
        loan.fundedAt = Date.now()
        loan.dueDate = Date.now() + (loan.duration * 24 * 60 * 60 * 1000)

        console.log(`💰 Loan funded: ${loan.id} by ${lenderAddress}`)
        return loan
    }

    /**
     * Record a repayment
     */
    recordRepayment(loanId, amount, txId) {
        const loan = this.loans.get(loanId)

        if (!loan) {
            throw new Error('Loan not found')
        }

        if (loan.status !== 'active') {
            throw new Error('Loan is not active')
        }

        // Update interest before recording repayment
        loan.interestAccrued = this.calculateInterest(loan)

        const repayment = {
            amount,
            txId,
            timestamp: Date.now()
        }

        loan.repayments.push(repayment)
        loan.totalRepaid += amount

        // Check if loan is fully repaid
        const totalDue = loan.amount + loan.interestAccrued
        if (loan.totalRepaid >= totalDue) {
            loan.status = 'repaid'
            console.log(`✅ Loan fully repaid: ${loan.id}`)
        } else {
            console.log(`💸 Repayment recorded: ${amount} QUSD for ${loan.id}`)
        }

        return loan
    }

    /**
     * Calculate accrued interest for a loan
     * Simple interest: I = P * r * t
     */
    calculateInterest(loan) {
        if (loan.status !== 'active' || !loan.fundedAt) {
            return 0
        }

        const secondsElapsed = (Date.now() - loan.fundedAt) / 1000
        const annualRate = loan.interestRate / 100
        const secondsPerYear = 365 * 24 * 60 * 60

        return (loan.amount * annualRate * secondsElapsed) / secondsPerYear
    }

    /**
     * Update interest for all active loans
     */
    updateAllInterest() {
        const activeLoans = this.getAllLoans('active')

        activeLoans.forEach(loan => {
            loan.interestAccrued = this.calculateInterest(loan)
        })

        return activeLoans.length
    }

    /**
     * Check for defaulted loans (past due date)
     */
    checkDefaults() {
        const activeLoans = this.getAllLoans('active')
        const now = Date.now()
        let defaultCount = 0

        activeLoans.forEach(loan => {
            if (loan.dueDate && now > loan.dueDate) {
                const totalDue = loan.amount + loan.interestAccrued
                if (loan.totalRepaid < totalDue) {
                    loan.status = 'defaulted'
                    defaultCount++
                    console.log(`⚠️ Loan defaulted: ${loan.id}`)
                }
            }
        })

        return defaultCount
    }

    /**
     * Get marketplace statistics
     */
    getStats() {
        const allLoans = Array.from(this.loans.values())

        return {
            totalLoans: allLoans.length,
            pendingLoans: allLoans.filter(l => l.status === 'pending').length,
            activeLoans: allLoans.filter(l => l.status === 'active').length,
            repaidLoans: allLoans.filter(l => l.status === 'repaid').length,
            defaultedLoans: allLoans.filter(l => l.status === 'defaulted').length,
            totalVolume: allLoans.reduce((sum, l) => sum + l.amount, 0),
            totalRepaid: allLoans.reduce((sum, l) => sum + l.totalRepaid, 0)
        }
    }
}
