import { useState } from 'react'
import { Wallet, X, Check } from 'lucide-react'

export default function WalletConnect({ address, onConnect, onDisconnect }) {
    const [showModal, setShowModal] = useState(false)
    const [inputAddress, setInputAddress] = useState('')

    const handleConnect = () => {
        if (inputAddress.trim()) {
            onConnect(inputAddress.trim())
            setShowModal(false)
            setInputAddress('')
        }
    }

    const truncateAddress = (addr) => {
        if (!addr) return ''
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    if (address) {
        return (
            <div className="flex items-center space-x-3">
                <div className="glass-effect px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-qubic-primary" />
                    <span className="font-mono text-sm">{truncateAddress(address)}</span>
                </div>
                <button
                    onClick={onDisconnect}
                    className="glass-effect px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                >
                    Disconnect
                </button>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-qubic-primary to-qubic-secondary px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all flex items-center space-x-2"
            >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-effect rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Connect Wallet</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="glass-effect p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">
                                    Enter your Qubic wallet address
                                </label>
                                <input
                                    type="text"
                                    value={inputAddress}
                                    onChange={(e) => setInputAddress(e.target.value)}
                                    placeholder="QUBIC_ADDRESS_HERE"
                                    className="w-full bg-black/30 px-4 py-3 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-qubic-primary"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    For demo purposes, you can enter any address
                                </p>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={!inputAddress.trim()}
                                className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                <Check className="w-5 h-5" />
                                <span>Connect</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
