import { useState, useEffect, Component } from 'react'
import { TrendingUp, Wallet, DollarSign, AlertTriangle, Activity, Shield, LogOut, LayoutDashboard } from 'lucide-react'
import io from 'socket.io-client'
import HealthIndicator from './components/HealthIndicator'
import Toast from './components/Toast'

const API_URL = 'http://localhost:3001'
const socket = io(API_URL)

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-qubic-darker via-qubic-dark to-qubic-darker flex items-center justify-center p-4">
                    <div className="glass-effect rounded-2xl p-8 max-w-md w-full text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                        <p className="text-gray-400 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-qubic-primary px-6 py-2 rounded-lg font-semibold hover:opacity-80 transition-opacity"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

function App() {
    const [walletAddress, setWalletAddress] = useState(localStorage.getItem('walletAddress') || '')
    const [connected, setConnected] = useState(false)
    const [position, setPosition] = useState(null)
    const [loading, setLoading] = useState(false)
    const [depositAmount, setDepositAmount] = useState('')
    const [borrowAmount, setBorrowAmount] = useState('')
    const [repayAmount, setRepayAmount] = useState('')
    const [supplyAmount, setSupplyAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawCollateralAmount, setWithdrawCollateralAmount] = useState('')
    const [toast, setToast] = useState(null)
    const [activeAction, setActiveAction] = useState(null) // 'supply' | 'borrow' | null

    const showToast = (message, type = 'info') => {
        setToast({ message, type })
    }

    // Auto-connect on mount if wallet address exists
    useEffect(() => {
        const savedAddress = localStorage.getItem('walletAddress')
        if (savedAddress) {
            setWalletAddress(savedAddress)
            setConnected(true)
        }
    }, [])

    useEffect(() => {
        if (connected) {
            fetchPosition()
        }
    }, [connected])

    useEffect(() => {
        socket.on('deposit-made', () => fetchPosition())
        socket.on('loan-created', () => fetchPosition())
        socket.on('repayment-made', () => fetchPosition())
        socket.on('interest-accrued', () => fetchPosition())
        socket.on('supply-made', () => fetchPosition())
        socket.on('withdrawal-made', () => fetchPosition())
        socket.on('supply-interest-accrued', () => fetchPosition())

        return () => {
            socket.off('deposit-made')
            socket.off('loan-created')
            socket.off('repayment-made')
            socket.off('interest-accrued')
            socket.off('supply-made')
            socket.off('withdrawal-made')
            socket.off('supply-interest-accrued')
        }
    }, [])

    const fetchPosition = async () => {
        if (!walletAddress) return

        try {
            const res = await fetch(`${API_URL}/api/user/${walletAddress}/position`)
            const data = await res.json()

            // Check if response is an error
            if (data.success === false) {
                console.error('Error fetching position:', data.message)
                showToast(data.message || 'Failed to fetch position', 'error')
                return
            }

            setPosition(data)
        } catch (error) {
            console.error('Error fetching position:', error)
            showToast('Network error fetching position', 'error')
        }
    }

    const handleConnect = async () => {
        if (!walletAddress.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress })
            })
            const data = await res.json()

            if (data.success) {
                localStorage.setItem('walletAddress', walletAddress)
                setConnected(true)
                fetchPosition()
            }
        } catch (error) {
            console.error('Error connecting:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount)

        if (!depositAmount || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid deposit amount', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount })
            })
            const data = await res.json()

            if (data.success) {
                setDepositAmount('')
                setPosition(data.position)
                showToast(`Successfully deposited ${amount} QX`, 'success')
            } else {
                showToast(data.message || 'Failed to deposit', 'error')
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleBorrow = async () => {
        const amount = parseFloat(borrowAmount)

        if (!borrowAmount || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid borrow amount', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/borrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount })
            })
            const data = await res.json()

            if (data.success) {
                console.log("the user positio ========= ", data.position)
                console.log("the user total borrowed ========= ", data.position.borrowedValue)

                setBorrowAmount('')
                setPosition(data.position)
                showToast(`Successfully borrowed ${amount} QUSD`, 'success')
            } else {
                showToast(data.message || 'Failed to borrow', 'error')
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleRepay = async () => {
        const amount = parseFloat(repayAmount)

        if (!repayAmount || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid repayment amount', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/repay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount })
            })
            const data = await res.json()

            if (data.success) {
                setRepayAmount('')
                setPosition(data.position)
                showToast(`Successfully repaid ${(data.result.amountRepaid || 0).toFixed(2)} QUSD`, 'success')
            } else {
                showToast(data.message || 'Failed to repay', 'error')
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSupply = async () => {
        const amount = parseFloat(supplyAmount)

        if (!supplyAmount || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid supply amount', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/supply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount })
            })
            const data = await res.json()

            if (data.success) {
                setSupplyAmount('')
                setPosition(data.position)
                showToast(`Successfully supplied ${amount} QUSD to pool`, 'success')
            } else {
                showToast(data.message || 'Failed to supply', 'error')
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount)

        if (!withdrawAmount || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid withdrawal amount', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount })
            })
            const data = await res.json()

            if (data.success) {
                setWithdrawAmount('')
                setPosition(data.position)
                showToast(`Successfully withdrawn ${amount} QUSD from pool`, 'success')
            } else {
                showToast(data.message || 'Failed to withdraw', 'error')
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleWithdrawCollateral = async () => {
        const amount = parseFloat(withdrawCollateralAmount)

        if (!withdrawCollateralAmount || isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid withdrawal amount', 'error')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/withdraw-collateral`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount })
            })
            const data = await res.json()

            if (data.success) {
                setWithdrawCollateralAmount('')
                setPosition(data.position)
                showToast(`Successfully withdrawn ${amount} QX collateral`, 'success')
            } else {
                showToast(data.message || 'Failed to withdraw collateral', 'error')
            }
        } catch (error) {
            showToast('Network error. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!connected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-qubic-darker via-qubic-dark to-qubic-darker flex items-center justify-center p-4">
                <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-qubic-primary to-qubic-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Welcome to LendQ</h1>
                        <p className="text-gray-400">Aave-Style Collateralized Lending</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                            <input
                                type="text"
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                                placeholder="Enter your Qubic wallet address"
                                className="w-full bg-black/30 px-4 py-3 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-qubic-primary"
                            />
                        </div>

                        <button
                            onClick={handleConnect}
                            disabled={loading || !walletAddress.trim()}
                            className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <Wallet className="w-5 h-5" />
                            <span>{loading ? 'Connecting...' : 'Connect'}</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!position) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-qubic-darker via-qubic-dark to-qubic-darker flex items-center justify-center">
                <Activity className="w-16 h-16 text-qubic-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <LayoutDashboard className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                    LendQ Protocol
                                </h1>
                                <p className="text-gray-400 text-sm">Decentralized Lending Market</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-800">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Wallet Connected</p>
                                <p className="font-mono text-sm text-slate-300">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('walletAddress')
                                    window.location.reload()
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                title="Disconnect"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-12">

                {/* SECTION 1: User Overview */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-100">Your Overview</h2>
                        {position.status === 'active' && (
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${position.healthFactor >= 1.5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                position.healthFactor >= 1.0 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                <Activity className="w-3 h-3" />
                                <span>Health Factor: {position.healthFactor.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1: Collateral */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <p className="text-sm text-slate-500 font-medium mb-1">Collateral Deposited</p>
                            <p className="text-3xl font-bold text-slate-100 mb-1">{(position.collateral.qx || 0).toFixed(2)} <span className="text-lg text-slate-500 font-normal">QX</span></p>
                            <p className="text-xs text-slate-500">${(position.collateral.valueUSD || 0).toFixed(2)} USD</p>
                        </div>

                        {/* Card 2: Available to Borrow */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <p className="text-sm text-slate-500 font-medium mb-1">Available to Borrow</p>
                            <p className="text-3xl font-bold text-emerald-400 mb-1">{(position.availableToBorrow || 0).toFixed(2)} <span className="text-lg text-emerald-500/50 font-normal">QUSD</span></p>
                            <p className="text-xs text-slate-500">Based on {(position.protocolParams?.ltvRatio * 100).toFixed(0)}% LTV</p>
                        </div>

                        {/* Card 3: Borrowed */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <p className="text-sm text-slate-500 font-medium mb-1">Borrowed Amount</p>
                            <p className="text-3xl font-bold text-slate-100 mb-1">{(position.borrowed.total || 0).toFixed(2)} <span className="text-lg text-slate-500 font-normal">QUSD</span></p>
                            <p className="text-xs text-slate-500">{position.borrowed.loans.length} active loan(s)</p>
                        </div>

                        {/* Card 4: Net APY / Health Detail */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <p className="text-sm text-slate-500 font-medium mb-1">Net Position</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-3xl font-bold text-slate-100">{(position.supplied.total || 0).toFixed(2)}</p>
                                <span className="text-sm text-slate-500">Supplied</span>
                            </div>
                            <div className="mt-2 flex items-center space-x-2 text-xs">
                                <span className="text-emerald-400">+{((position.supplied.apy || 0) * 100).toFixed(1)}% APY</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">Earned: {(position.supplied.interestEarned || 0).toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: Liquidity Pool Stats */}
                <section>
                    <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-blue-500">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-100 mb-1">Market Liquidity</h3>
                                <p className="text-sm text-slate-500">Real-time pool statistics</p>
                            </div>

                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Liquidity</p>
                                    <p className="text-xl font-bold text-slate-200">{(position.liquidityPool.totalSupplied || 0).toLocaleString()} QUSD</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Available</p>
                                    <p className="text-xl font-bold text-slate-200">{(position.liquidityPool.availableLiquidity || 0).toLocaleString()} QUSD</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Utilization</p>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${(position.liquidityPool.utilizationRate || 0) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-slate-300">{((position.liquidityPool.utilizationRate || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">APRs</p>
                                    <div className="flex space-x-4 text-sm">
                                        <div>
                                            <span className="text-emerald-400 font-bold">{((position.protocolParams?.supplyApy || 0) * 100).toFixed(1)}%</span>
                                            <span className="text-slate-600 ml-1">Supply</span>
                                        </div>
                                        <div>
                                            <span className="text-blue-400 font-bold">{((position.protocolParams?.borrowApy || 0) * 100).toFixed(1)}%</span>
                                            <span className="text-slate-600 ml-1">Borrow</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: Action Buttons */}
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setActiveAction(activeAction === 'supply' ? null : 'supply')}
                            className={`p-8 rounded-2xl border transition-all text-left group ${activeAction === 'supply'
                                ? 'bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/20'
                                : 'glass-panel hover:border-emerald-500/30'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="text-emerald-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Earn Yield &rarr;</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 mb-2">Supply to Pool</h3>
                            <p className="text-slate-400 text-sm">Deposit QUSD to earn {((position.protocolParams?.supplyApy || 0) * 100).toFixed(1)}% APY passive income.</p>

                            {activeAction === 'supply' && (
                                <div className="mt-6 pt-6 border-t border-slate-700 animate-fade-in" onClick={e => e.stopPropagation()}>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            value={supplyAmount}
                                            onChange={(e) => setSupplyAmount(e.target.value)}
                                            placeholder="Amount to supply"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                        <button
                                            onClick={handleSupply}
                                            disabled={loading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveAction(activeAction === 'borrow' ? null : 'borrow')}
                            className={`p-8 rounded-2xl border transition-all text-left group ${activeAction === 'borrow'
                                ? 'bg-slate-800 border-blue-500/50 ring-1 ring-blue-500/20'
                                : 'glass-panel hover:border-blue-500/30'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <span className="text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Get Liquidity &rarr;</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 mb-2">Borrow QUSD</h3>
                            <p className="text-slate-400 text-sm">Borrow against your QX collateral at {((position.protocolParams?.borrowApy || 0) * 100).toFixed(1)}% APR.</p>

                            {activeAction === 'borrow' && (
                                <div className="mt-6 pt-6 border-t border-slate-700 animate-fade-in" onClick={e => e.stopPropagation()}>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            value={borrowAmount}
                                            onChange={(e) => setBorrowAmount(e.target.value)}
                                            placeholder="Amount to borrow"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                        <button
                                            onClick={handleBorrow}
                                            disabled={loading}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>
                </section>

                {/* SECTION 4: User Positions */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Loans */}
                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-100">Active Loans</h3>
                            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">{position.borrowed.loans.length} Active</span>
                        </div>
                        <div className="p-6">
                            {position.borrowed.loans.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>No active loans</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {position.borrowed.loans.map((loan, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                                            <div>
                                                <p className="text-sm text-slate-400 mb-1">Loan #{loan.id}</p>
                                                <p className="font-bold text-slate-200">{loan.total.toFixed(2)} QUSD</p>
                                                <p className="text-xs text-slate-500 mt-1">Interest: {loan.interest.toFixed(4)}</p>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-blue-500"
                                                    value={repayAmount}
                                                    onChange={(e) => setRepayAmount(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleRepay}
                                                    className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded transition-colors"
                                                >
                                                    Repay
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collateral & Supply */}
                    <div className="space-y-6">
                        {/* Collateral Details */}
                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800">
                                <h3 className="font-semibold text-slate-100">Collateral Assets</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800 mb-4">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">Q</div>
                                            <span className="font-bold text-slate-200">QX</span>
                                        </div>
                                        <p className="text-sm text-slate-400">{(position.collateral.qx || 0).toFixed(2)} deposited</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-red-500"
                                            value={withdrawCollateralAmount}
                                            onChange={(e) => setWithdrawCollateralAmount(e.target.value)}
                                        />
                                        <button
                                            onClick={handleWithdrawCollateral}
                                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800/50">
                                    <p className="text-xs text-slate-500 mb-2">Add more collateral</p>
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            placeholder="Amount QX"
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                        />
                                        <button
                                            onClick={handleDeposit}
                                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-sm font-medium transition-colors"
                                        >
                                            Deposit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Supply Details */}
                        <div className="glass-panel rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800">
                                <h3 className="font-semibold text-slate-100">Supplied Assets</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">$</div>
                                            <span className="font-bold text-slate-200">QUSD</span>
                                        </div>
                                        <p className="text-sm text-slate-400">{(position.supplied.total || 0).toFixed(2)} supplied</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-yellow-500"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                        />
                                        <button
                                            onClick={handleWithdraw}
                                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}

export default function AppWithBoundary() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    )
}
