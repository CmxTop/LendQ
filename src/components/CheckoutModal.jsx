import { useState, useEffect } from 'react'
import { X, Trash2, Plus, Minus, Copy, CheckCircle, Loader, QrCode } from 'lucide-react'
import QRCodeReact from 'qrcode.react'

// Demo Qubic wallet address (replace with actual address)
const QUBIC_WALLET_ADDRESS = 'QUBICDEMOWALLET123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function CheckoutModal({
    cart,
    totalPrice,
    onClose,
    onUpdateQuantity,
    onRemoveItem,
    onPaymentComplete,
    orderStatus
}) {
    const [copied, setCopied] = useState(false)
    const [paymentStep, setPaymentStep] = useState('review') // review, payment, waiting, confirmed
    const [showQR, setShowQR] = useState(false)

    // Simulate payment detection (in real app, this would be triggered by webhook)
    useEffect(() => {
        if (paymentStep === 'waiting') {
            // Simulate payment detection after 5 seconds for demo purposes
            const timer = setTimeout(() => {
                setPaymentStep('confirmed')
                onPaymentComplete()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [paymentStep, onPaymentComplete])

    const copyAddress = () => {
        navigator.clipboard.writeText(QUBIC_WALLET_ADDRESS)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleProceedToPayment = () => {
        setPaymentStep('payment')
    }

    const handleConfirmPayment = () => {
        setPaymentStep('waiting')
    }

    if (orderStatus === 'confirmed' || paymentStep === 'confirmed') {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="glass-effect rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 text-green-400">Payment Confirmed!</h2>
                    <p className="text-gray-300 mb-6">
                        Your order has been processed successfully. Check your email for download links.
                    </p>
                    <div className="glass-effect p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Transaction verified on Qubic Network</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-effect rounded-2xl p-6 max-w-2xl w-full my-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">
                        {paymentStep === 'review' && 'Review Order'}
                        {paymentStep === 'payment' && 'Payment Details'}
                        {paymentStep === 'waiting' && 'Waiting for Payment'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="glass-effect p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Review Step */}
                {paymentStep === 'review' && (
                    <>
                        {/* Cart Items */}
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.id} className="glass-effect p-4 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="text-3xl">{item.image}</div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <p className="text-sm text-gray-400">{item.price} QUBIC each</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center space-x-2 glass-effect rounded-lg p-1">
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Subtotal */}
                                        <div className="w-24 text-right font-bold text-qubic-primary">
                                            {item.price * item.quantity}
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => onRemoveItem(item.id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="glass-effect p-6 rounded-xl mb-6">
                            <div className="flex items-center justify-between text-2xl font-bold">
                                <span>Total:</span>
                                <span className="bg-gradient-to-r from-qubic-primary to-qubic-secondary bg-clip-text text-transparent">
                                    {totalPrice} QUBIC
                                </span>
                            </div>
                        </div>

                        {/* Proceed Button */}
                        <button
                            onClick={handleProceedToPayment}
                            className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-qubic-primary/50 transition-all"
                        >
                            Proceed to Payment
                        </button>
                    </>
                )}

                {/* Payment Step */}
                {paymentStep === 'payment' && (
                    <>
                        <div className="space-y-6">
                            {/* Instructions */}
                            <div className="glass-effect p-6 rounded-xl">
                                <h3 className="font-semibold mb-3 text-qubic-primary">Payment Instructions</h3>
                                <ol className="space-y-2 text-sm text-gray-300">
                                    <li>1. Copy the wallet address below</li>
                                    <li>2. Send exactly <span className="font-bold text-qubic-primary">{totalPrice} QUBIC</span> to this address</li>
                                    <li>3. Click "I've Sent the Payment" button</li>
                                    <li>4. Wait for blockchain confirmation (usually 10-30 seconds)</li>
                                </ol>
                            </div>

                            {/* QR Code Toggle */}
                            <div className="text-center">
                                <button
                                    onClick={() => setShowQR(!showQR)}
                                    className="glass-effect px-6 py-3 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center space-x-2"
                                >
                                    <QrCode className="w-5 h-5" />
                                    <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
                                </button>
                            </div>

                            {/* QR Code */}
                            {showQR && (
                                <div className="flex justify-center">
                                    <div className="bg-white p-4 rounded-xl">
                                        <QRCodeReact value={QUBIC_WALLET_ADDRESS} size={200} />
                                    </div>
                                </div>
                            )}

                            {/* Wallet Address */}
                            <div className="glass-effect p-4 rounded-xl">
                                <label className="text-sm text-gray-400 mb-2 block">Wallet Address</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={QUBIC_WALLET_ADDRESS}
                                        readOnly
                                        className="flex-1 bg-black/30 px-4 py-3 rounded-lg font-mono text-sm"
                                    />
                                    <button
                                        onClick={copyAddress}
                                        className="glass-effect px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
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
                            <div className="glass-effect p-4 rounded-xl">
                                <label className="text-sm text-gray-400 mb-2 block">Amount to Send</label>
                                <div className="text-3xl font-bold bg-gradient-to-r from-qubic-primary to-qubic-secondary bg-clip-text text-transparent">
                                    {totalPrice} QUBIC
                                </div>
                            </div>

                            {/* Confirm Payment Button */}
                            <button
                                onClick={handleConfirmPayment}
                                className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-qubic-primary/50 transition-all"
                            >
                                I've Sent the Payment
                            </button>

                            <button
                                onClick={() => setPaymentStep('review')}
                                className="w-full glass-effect py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                            >
                                Back to Cart
                            </button>
                        </div>
                    </>
                )}

                {/* Waiting Step */}
                {paymentStep === 'waiting' && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-qubic-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader className="w-12 h-12 text-qubic-primary animate-spin" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Detecting Payment...</h3>
                        <p className="text-gray-400 mb-6">
                            Waiting for blockchain confirmation. This usually takes 10-30 seconds.
                        </p>
                        <div className="glass-effect p-4 rounded-lg max-w-md mx-auto">
                            <p className="text-sm text-gray-400">
                                EasyConnect is monitoring the Qubic network for your transaction
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
