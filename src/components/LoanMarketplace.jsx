import { useState, useEffect } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
import LoanCard from './LoanCard'

const API_URL = 'http://localhost:3001'

export default function LoanMarketplace({ userAddress, onFund, onRepay }) {
    const [loans, setLoans] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending') // pending | active | all

    useEffect(() => {
        fetchLoans()
    }, [filter])

    const fetchLoans = async () => {
        setLoading(true)
        try {
            const url = filter === 'all'
                ? `${API_URL}/api/loans`
                : `${API_URL}/api/loans?status=${filter}`

            const res = await fetch(url)
            const data = await res.json()
            setLoans(data)
        } catch (error) {
            console.error('Error fetching loans:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Loan Marketplace</h2>
                    <p className="text-gray-400 text-sm">
                        Browse and fund loan requests from the community
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

            {/* Filters */}
            <div className="flex space-x-2 mb-6">
                {['pending', 'active', 'all'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === f
                                ? 'bg-gradient-to-r from-qubic-primary to-qubic-secondary'
                                : 'glass-effect hover:bg-white/10'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Loans Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <RefreshCw className="w-12 h-12 text-qubic-primary mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Loading loans...</p>
                </div>
            ) : loans.length === 0 ? (
                <div className="text-center py-20 glass-effect rounded-xl">
                    <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No loans found</h3>
                    <p className="text-gray-400">
                        {filter === 'pending'
                            ? 'No pending loan requests at the moment'
                            : 'No loans match your filter'}
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
