import { useState } from 'react'
import { X, Copy, CheckCircle, Loader, QrCode as QrCodeIcon } from 'lucide-react'
import QRCode from 'qrcode.react'

const API_URL = 'http://localhost:3001'
const DEMO_WALLET_ADDRESS = 'QUBIC_LENDQ_DEMO_WALLET_ADDRESS_123456789'

export default function ActionModal({ type, position, protocolParams, onClose }) {
    const [amount, setAmount] = useState('')
    const [step, setStep] = useState('input') // 'input' | 'payment' | 'processing' | 'success'
    const [copied, setCopied] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async () => {
        setError(null)
        const numAmount = parseFloat(amount)

        if (!numAmount || numAmount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        if (type === 'deposit') {
            // Show payment screen for deposit
            setStep('payment')
        } else if (type === 'borrow') {
            // Validate and execute borrow
            if (numAmount > position.availableToBorrow) {
                setError(`Amount exceeds borrowing limit. You can borrow up to ${position.availableToBorrow.toFixed(2)} QUSD based on your ${position.collateral.qx.toFixed(2)} QX collateral.`)
                return
            }

            setStep('processing')
            try {
                const res = await fetch(`${API_URL}/api/borrow`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: numAmount })
                })
                const data = await res.json()

                if (data.success) {
                    setStep('success')
                    setTimeout(() => onClose(), 2000)
                } else {
                    setError(data.message)
                    setStep('input')
                }
            } catch (err) {
                console.error('Borrow error:', err)
                setError(`Failed to borrow: ${err.message || 'Please try again'}`)
                setStep('input')
            }
        } else if (type === 'repay') {
            // Show payment screen for repayment
            if (numAmount > position.loan.totalDebt) {
                setError(`Amount exceeds total debt. Your total debt is ${position.loan.totalDebt.toFixed(2)} QUSD (${position.loan.principal.toFixed(2)} principal + ${position.loan.interestAccrued.toFixed(4)} interest).`)
                return
            }
            setStep('payment')
        }
    }

    const handlePaymentConfirm = () => {
        setStep('processing')
        // In real app, user sends transaction and EasyConnect detects it
        // For demo, we'll simulate with test endpoint
        setTimeout(() => {
            setStep('success')
            setTimeout(() => onClose(), 2000)
        }, 2000)
    }

    const copyAddress = () => {
        navigator.clipboard.writeText(DEMO_WALLET_ADDRESS)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getTitle = () => {
        if (type === 'deposit') return 'Deposit QX Collateral'
        if (type === 'borrow') return 'Borrow QUSD'
        return 'Repay Loan'
    }

    const getMaxAmount = () => {
        if (type === 'borrow') return position.availableToBorrow
        if (type === 'repay') return position.loan.totalDebt
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-effect rounded-2xl p-6 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{getTitle()}</h2>
                    <button
                        onClick={onClose}
                        className="glass-effect p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Input Step */}
                {step === 'input' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">
                                Amount {type === 'deposit' ? '(QX)' : '(QUSD)'}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-black/30 px-4 py-3 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-qubic-primary"
                                    step="0.01"
                                    min="0"
                                />
                                {getMaxAmount() !== null && (
                                    <button
                                        onClick={() => setAmount(getMaxAmount().toFixed(2))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm px-3 py-1 bg-qubic-primary/20 hover:bg-qubic-primary/30 rounded transition-colors"
                                    >
                                        MAX
                                    </button>
                                )}
                            </div>
                            {getMaxAmount() !== null && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Max: {getMaxAmount().toFixed(2)} {type === 'deposit' ? 'QX' : 'QUSD'}
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {type === 'borrow' && amount && (
                            <div className="glass-effect p-4 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Borrow amount:</span>
                                    <span className="font-semibold">{amount} QUSD</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">APY:</span>
                                    <span className="font-semibold">{(protocolParams.BORROW_APY * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">New health factor:</span>
                                    <span className="font-semibold">
                                        {((position.collateral.valueUSD * protocolParams.LIQUIDATION_THRESHOLD) / (position.loan.totalDebt + parseFloat(amount || 0))).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all"
                        >
                            Continue
                        </button>
                    </div>
                )}

                {/* Payment Step */}
                {step === 'payment' && (
                    <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-sm">
                            <p className="text-blue-400 mb-2">
                                Send exactly <span className="font-bold">{amount} {type === 'deposit' ? 'QX' : 'QUSD'}</span> to the address below
                            </p>
                            <p className="text-gray-400">
                                EasyConnect will automatically detect your transaction
                            </p>
                        </div>

                        {/* QR Code Toggle */}
                        <div className="text-center">
                            <button
                                onClick={() => setShowQR(!showQR)}
                                className="glass-effect px-4 py-2 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center space-x-2"
                            >
                                <QrCodeIcon className="w-4 h-4" />
                                <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
                            </button>
                        </div>

                        {showQR && (
                            <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-xl">
                                    <QRCode value={DEMO_WALLET_ADDRESS} size={180} />
                                </div>
                            </div>
                        )}

                        {/* Wallet Address */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={DEMO_WALLET_ADDRESS}
                                    readOnly
                                    className="flex-1 bg-black/30 px-3 py-2 rounded-lg font-mono text-xs"
                                />
                                <button
                                    onClick={copyAddress}
                                    className="glass-effect px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {copied ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="glass-effect p-4 rounded-lg">
                            <label className="text-sm text-gray-400 mb-2 block">Amount to Send</label>
                            <div className="text-2xl font-bold bg-gradient-to-r from-qubic-primary to-qubic-secondary bg-clip-text text-transparent">
                                {amount} {type === 'deposit' ? 'QX' : 'QUSD'}
                            </div>
                        </div>

                        <button
                            onClick={handlePaymentConfirm}
                            className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all"
                        >
                            I've Sent the Payment
                        </button>

                        <button
                            onClick={() => setStep('input')}
                            className="w-full glass-effect py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                        >
                            Back
                        </button>
                    </div>
                )}

                {/* Processing Step */}
                {step === 'processing' && (
                    <div className="text-center py-8">
                        <Loader className="w-16 h-16 text-qubic-primary mx-auto mb-4 animate-spin" />
                        <h3 className="text-xl font-bold mb-2">Processing...</h3>
                        <p className="text-gray-400">
                            {type === 'borrow' ? 'Creating loan...' : 'Detecting transaction...'}
                        </p>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-green-400">Success!</h3>
                        <p className="text-gray-300">
                            {type === 'deposit' && `Deposited ${amount} QX`}
                            {type === 'borrow' && `Borrowed ${amount} QUSD`}
                            {type === 'repay' && `Repaid ${amount} QUSD`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
