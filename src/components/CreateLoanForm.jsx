import { useState } from 'react'
import { DollarSign, Percent, Calendar, FileText, Send } from 'lucide-react'

const API_URL = 'http://localhost:3001'

export default function CreateLoanForm({ userAddress, onSuccess }) {
    const [formData, setFormData] = useState({
        amount: '',
        interestRate: '',
        duration: '',
        purpose: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await fetch(`${API_URL}/api/loans/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    borrowerAddress: userAddress,
                    amount: parseFloat(formData.amount),
                    interestRate: parseFloat(formData.interestRate),
                    duration: parseInt(formData.duration),
                    purpose: formData.purpose
                })
            })

            const data = await res.json()

            if (data.success) {
                // Reset form
                setFormData({ amount: '', interestRate: '', duration: '', purpose: '' })
                if (onSuccess) onSuccess(data.loan)
            } else {
                setError(data.message)
            }
        } catch (err) {
            setError('Failed to create loan request. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="glass-effect rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-2">Create Loan Request</h2>
                <p className="text-gray-400 mb-6">
                    Request a loan from the LendQ community
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Loan Amount (QUSD)</span>
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            placeholder="1000"
                            step="0.01"
                            min="1"
                            required
                            className="w-full bg-black/30 px-4 py-3 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-qubic-primary"
                        />
                    </div>

                    {/* Interest Rate */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center space-x-2">
                            <Percent className="w-4 h-4" />
                            <span>Interest Rate (% APY)</span>
                        </label>
                        <input
                            type="number"
                            value={formData.interestRate}
                            onChange={(e) => handleChange('interestRate', e.target.value)}
                            placeholder="12"
                            step="0.1"
                            min="0.1"
                            max="100"
                            required
                            className="w-full bg-black/30 px-4 py-3 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-qubic-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Higher rates attract lenders faster
                        </p>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Loan Duration (days)</span>
                        </label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => handleChange('duration', e.target.value)}
                            placeholder="30"
                            min="1"
                            max="365"
                            required
                            className="w-full bg-black/30 px-4 py-3 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-qubic-primary"
                        />
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Purpose (Optional)</span>
                        </label>
                        <textarea
                            value={formData.purpose}
                            onChange={(e) => handleChange('purpose', e.target.value)}
                            placeholder="Describe what you'll use the loan for..."
                            rows={3}
                            className="w-full bg-black/30 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-qubic-primary resize-none"
                        />
                    </div>

                    {/* Preview */}
                    {formData.amount && formData.interestRate && formData.duration && (
                        <div className="glass-effect p-4 rounded-lg space-y-2 text-sm">
                            <h3 className="font-semibold mb-2">Loan Preview</h3>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Loan Amount:</span>
                                <span className="font-semibold">{formData.amount} QUSD</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Interest Rate:</span>
                                <span className="font-semibold">{formData.interestRate}% APY</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Duration:</span>
                                <span className="font-semibold">{formData.duration} days</span>
                            </div>
                            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                                <span className="text-gray-400">Estimated Interest:</span>
                                <span className="font-semibold text-yellow-400">
                                    {(parseFloat(formData.amount) * parseFloat(formData.interestRate) / 100 * parseInt(formData.duration) / 365).toFixed(2)} QUSD
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-qubic-primary to-qubic-secondary py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-qubic-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        <Send className="w-5 h-5" />
                        <span>{loading ? 'Creating...' : 'Create Loan Request'}</span>
                    </button>
                </form>
            </div>
        </div>
    )
}
