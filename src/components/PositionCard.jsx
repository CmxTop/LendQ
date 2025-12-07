import { Wallet, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export default function PositionCard({ position, protocolParams, onDeposit, onBorrow, onRepay }) {
    const hasCollateral = position.collateral.qx > 0
    const hasLoan = position.loan.totalDebt > 0

    return (
        <div className="glass-effect rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-qubic-primary/20 to-qubic-secondary/20 p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold mb-2">Your Position</h2>
                <p className="text-gray-400 text-sm">
                    {position.status === 'no_loan' && 'No active loan'}
                    {position.status === 'active' && 'Loan active'}
                    {position.status === 'liquidated' && '⚠️ Position liquidated'}
                </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Collateral Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <Wallet className="w-5 h-5 text-qubic-primary" />
                            <h3 className="font-semibold">Collateral</h3>
                        </div>
                        <button
                            onClick={onDeposit}
                            className="text-sm px-4 py-2 bg-qubic-primary/20 hover:bg-qubic-primary/30 rounded-lg transition-colors"
                        >
                            + Deposit
                        </button>
                    </div>
                    <div className="glass-effect p-4 rounded-lg">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold">{position.collateral.qx.toFixed(2)}</span>
                            <span className="text-gray-400">QX</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                            ≈ ${position.collateral.valueUSD.toFixed(2)} USD
                        </p>
                    </div>
                </div>

                {/* Loan Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-qubic-secondary" />
                            <h3 className="font-semibold">Loan</h3>
                        </div>
                        {hasLoan && (
                            <button
                                onClick={onRepay}
                                className="text-sm px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors text-green-400"
                            >
                                Repay
                            </button>
                        )}
                    </div>
                    <div className="glass-effect p-4 rounded-lg">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold">{position.loan.totalDebt.toFixed(2)}</span>
                            <span className="text-gray-400">QUSD</span>
                        </div>
                        {hasLoan && (
                            <div className="mt-2 text-sm">
                                <p className="text-gray-400">
                                    Principal: {position.loan.principal.toFixed(2)} QUSD
                                </p>
                                <p className="text-gray-400">
                                    Interest: {position.loan.interestAccrued.toFixed(4)} QUSD
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Available to Borrow */}
                {hasCollateral && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <h3 className="font-semibold">Available to Borrow</h3>
                        </div>
                        <div className="glass-effect p-4 rounded-lg">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-bold text-green-400">
                                    {position.availableToBorrow.toFixed(2)}
                                </span>
                                <span className="text-gray-400">QUSD</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                                Max borrow: {position.maxBorrow.toFixed(2)} QUSD ({(protocolParams.LTV_RATIO * 100).toFixed(0)}% LTV)
                            </p>
                            {position.availableToBorrow > 0 && (
                                <button
                                    onClick={onBorrow}
                                    className="mt-3 w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all"
                                >
                                    Borrow Now
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* No Collateral Message */}
                {!hasCollateral && (
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-blue-400 font-semibold mb-1">Get Started</p>
                            <p className="text-sm text-gray-400">
                                Deposit QX collateral to start borrowing QUSD stablecoins.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
