import { useState, useEffect } from 'react'
import { TrendingDown, TrendingUp, RefreshCw } from 'lucide-react'
import LoanCard from './LoanCard'

const API_URL = 'http://localhost:3001'

export default function MyLoans({ userAddress, onRepay, onFund }) {
    const [activeTab, setActiveTab] = useState('borrowed') // borrowed | funded
    const [loans, setLoans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLoans()
    }, [activeTab, userAddress])

    const fetchLoans = async () => {
        setLoading(true)
        try {
            const role = activeTab === 'borrowed' ? 'borrower' : 'lender'
            const res = await fetch(`${API_URL}/api/loans/my/${userAddress}?role=${role}`)
            const data = await res.json()
            setLoans(data)
        } catch (error) {
            console.error('Error fetching loans:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = () => {
        if (activeTab === 'borrowed') {
            const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0)
            const totalRepaid = loans.reduce((sum, l) => sum + l.totalRepaid, 0)
            const totalInterest = loans.reduce((sum, l) => sum + l.interestAccrued, 0)
            const activeCount = loans.filter(l => l.status === 'active').length

            return { totalBorrowed, totalRepaid, totalInterest, activeCount }
        } else {
            const totalLent = loans.reduce((sum, l) => sum + l.amount, 0)
            const totalReceived = loans.reduce((sum, l) => sum + l.totalRepaid, 0)
            const totalInterest = loans.reduce((sum, l) => sum + l.interestAccrued, 0)
            const activeCount = loans.filter(l => l.status === 'active').length

            return { totalLent, totalReceived, totalInterest, activeCount }
        }
    }

    const stats = calculateStats()

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">My Loans</h2>
                    <p className="text-gray-400 text-sm">
                        Track your borrowed and funded loans
                    </p>
                </div>
                <button
                    onClick={fetchLoans}
                    className="glass-effect px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6">
                {['borrowed', 'funded'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${activeTab === tab
                                ? 'bg-gradient-to-r from-qubic-primary to-qubic-secondary'
                                : 'glass-effect hover:bg-white/10'
                            }`}
                    >
                        {tab === 'borrowed' ? (
                            <TrendingDown className="w-5 h-5" />
                        ) : (
                            <TrendingUp className="w-5 h-5" />
                        )}
                        <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-effect p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">
                        {activeTab === 'borrowed' ? 'Total Borrowed' : 'Total Lent'}
                    </p>
                    <p className="text-2xl font-bold">
                        {(activeTab === 'borrowed' ? stats.totalBorrowed : stats.totalLent).toFixed(2)} QUSD
                    </p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">
                        {activeTab === 'borrowed' ? 'Total Repaid' : 'Total Received'}
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                        {(activeTab === 'borrowed' ? stats.totalRepaid : stats.totalReceived).toFixed(2)} QUSD
                    </p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">
                        {activeTab === 'borrowed' ? 'Interest Accrued' : 'Interest Earned'}
                    </p>
                    <p className="text-2xl font-bold text-yellow-400">
                        {stats.totalInterest.toFixed(4)} QUSD
                    </p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Active Loans</p>
                    <p className="text-2xl font-bold">{stats.activeCount}</p>
                </div>
            </div>

            {/* Loans List */}
            {loading ? (
                <div className="text-center py-20">
                    <RefreshCw className="w-12 h-12 text-qubic-primary mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Loading loans...</p>
                </div>
            ) : loans.length === 0 ? (
                <div className="text-center py-20 glass-effect rounded-xl">
                    {activeTab === 'borrowed' ? (
                        <TrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    ) : (
                        <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    )}
                    <h3 className="text-xl font-bold mb-2">No loans yet</h3>
                    <p className="text-gray-400">
                        {activeTab === 'borrowed'
                            ? 'Create a loan request to get started'
                            : 'Fund loans from the marketplace to start earning'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loans.map((loan) => (
                        <LoanCard
                            key={loan.id}
                            loan={loan}
                            userAddress={userAddress}
                            onFund={onFund}
                            onRepay={onRepay}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
