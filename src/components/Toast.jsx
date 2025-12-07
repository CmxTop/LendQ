import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 5000)

        return () => clearTimeout(timer)
    }, []) // Run only on mount

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    }

    const colors = {
        success: 'bg-green-500/20 border-green-500/50 text-green-400',
        error: 'bg-red-500/20 border-red-500/50 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }

    return (
        <div className={`fixed top-4 right-4 z-50 glass-effect border ${colors[type]} rounded-lg p-4 min-w-[300px] max-w-md animate-slide-in flex items-start space-x-3`}>
            {icons[type]}
            <p className="flex-1 text-sm">{message}</p>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
