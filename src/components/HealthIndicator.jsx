export default function HealthIndicator({ healthFactor, healthStatus }) {
    if (!healthFactor) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-400">No active loan</p>
            </div>
        )
    }

    const getColor = () => {
        if (healthStatus.status === 'safe') return 'text-green-400'
        if (healthStatus.status === 'warning') return 'text-yellow-400'
        return 'text-red-400'
    }

    const getProgressColor = () => {
        if (healthStatus.status === 'safe') return 'stroke-green-400'
        if (healthStatus.status === 'warning') return 'stroke-yellow-400'
        return 'stroke-red-400'
    }

    // Calculate progress (cap at 200% for display)
    const displayHF = Math.min(healthFactor, 2.0)
    const progress = (displayHF / 2.0) * 100

    return (
        <div className="flex items-center justify-between">
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-white/10"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                        className={`${getProgressColor()} transition-all duration-500`}
                        strokeLinecap="round"
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${getColor()}`}>
                            {healthFactor.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">HF</p>
                    </div>
                </div>
            </div>

            {/* Status Info */}
            <div className="flex-1 ml-8">
                <h3 className={`text-2xl font-bold mb-2 ${getColor()}`}>
                    {healthStatus.status === 'safe' && '✓ Healthy'}
                    {healthStatus.status === 'warning' && '⚠ Warning'}
                    {healthStatus.status === 'danger' && '🚨 Danger'}
                </h3>
                <p className="text-gray-300 mb-4">{healthStatus.message}</p>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Health Factor:</span>
                        <span className="font-semibold">{healthFactor.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Liquidation at:</span>
                        <span className="font-semibold text-red-400">&lt; 1.0</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-semibold ${getColor()}`}>
                            {healthStatus.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {healthStatus.status === 'danger' && (
                    <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                        <p className="text-red-400 text-sm font-semibold">
                            ⚠️ Action Required: Repay debt or deposit more collateral to avoid liquidation!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
