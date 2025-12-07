import { DollarSign, Calendar, TrendingUp, User } from 'lucide-react'

export default function LoanCard({ loan, userAddress, onFund, onRepay, onViewDetails }) {
    const isOwnLoan = loan.borrowerAddress === userAddress
    const isLender = loan.lenderAddress === userAddress
    const canFund = loan.status === 'pending' && !isOwnLoan && userAddress
    const canRepay = loan.status === 'active' && isOwnLoan

    const truncateAddress = (addr) => {
        if (!addr) return 'Not funded'
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    const getStatusColor = () => {
        switch (loan.status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50'
            case 'repaid': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            case 'defaulted': return 'bg-red-500/20 text-red-400 border-red-500/50'
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
        }
    }

    const totalDue = loan.amount + loan.interestAccrued
    const remainingDebt = totalDue - loan.totalRepaid

    return (
        <div className="glass-effect rounded-xl p-6 hover:bg-white/5 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-bold">Loan #{loan.id.split('_')[1]}</h3>
                        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor()}`}>
                            {loan.status.toUpperCase()}
                        </span>
                    </div>
                    {isOwnLoan && (
                        <span className="text-xs bg-qubic-primary/20 text-qubic-primary px-2 py-1 rounded">
                            Your Loan
                        </span>
                    )}
                    {isLender && (
                        <span className="text-xs bg-qubic-secondary/20 text-qubic-secondary px-2 py-1 rounded">
                            You Funded This
                        </span>
                    )}
                </div>
                <DollarSign className="w-8 h-8 text-qubic-primary" />
            </div>

            {/* Amount */}
            <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Loan Amount</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-qubic-primary to-qubic-secondary bg-clip-text text-transparent">
                    {loan.amount.toFixed(2)} QUSD
                </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Interest Rate</p>
                    <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <p className="font-semibold">{loan.interestRate}% APY</p>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Duration</p>
                    <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <p className="font-semibold">{loan.duration} days</p>
                    </div>
                </div>
            </div>

            {/* Borrower/Lender Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Borrower:</span>
                    <span className="font-mono">{truncateAddress(loan.borrowerAddress)}</span>
                </div>
                {loan.lenderAddress && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Lender:</span>
                        <span className="font-mono">{truncateAddress(loan.lenderAddress)}</span>
                    </div>
                )}
            </div>

            {/* Active Loan Details */}
            {loan.status === 'active' && (
                <div className="glass-effect p-3 rounded-lg mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Interest Accrued:</span>
                        <span className="font-semibold text-yellow-400">
                            {loan.interestAccrued.toFixed(4)} QUSD
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total Repaid:</span>
                        <span className="font-semibold text-green-400">
                            {loan.totalRepaid.toFixed(2)} QUSD
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Remaining:</span>
                        <span className="font-semibold text-red-400">
                            {remainingDebt.toFixed(2)} QUSD
                        </span>
                    </div>
                </div>
            )}

            {/* Purpose */}
            {loan.purpose && (
                <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Purpose</p>
                    <p className="text-sm text-gray-300">{loan.purpose}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
                {canFund && (
                    <button
                        onClick={() => onFund(loan)}
                        className="flex-1 bg-gradient-to-r from-qubic-primary to-qubic-secondary py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all"
                    >
                        Fund This Loan
                    </button>
                )}
                {canRepay && (
                    <button
                        onClick={() => onRepay(loan)}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 py-2 rounded-lg font-semibold transition-all border border-green-500/50 text-green-400"
                    >
                        Make Payment
                    </button>
                )}
                {!canFund && !canRepay && loan.status !== 'pending' && (
                    <button
                        onClick={() => onViewDetails && onViewDetails(loan)}
                        className="flex-1 glass-effect py-2 rounded-lg font-semibold hover:bg-white/10 transition-all"
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    )
}
