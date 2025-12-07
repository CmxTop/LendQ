// Protocol Constants
// These values can be changed in one place and will update across the entire codebase

// LTV (Loan-to-Value) Ratios for different collateral assets
export const QX_QUSD_LTV = 0.75  // 75% - Users can borrow up to 75% of their QX collateral value

// Liquidation Thresholds
export const QX_LIQUIDATION_THRESHOLD = 0.85  // 85% - Liquidation occurs when debt exceeds 85% of collateral value

// Interest Rates (APY)
export const BORROW_APY = 0.10  // 10% - Annual interest rate for borrowers
export const SUPPLY_APY = 0.08  // 8% - Annual interest rate for liquidity suppliers

// Interest Accrual
export const INTEREST_TICK_SECONDS = 60  // Interest accrues every 60 seconds

// Asset Naming Convention:
// [COLLATERAL_ASSET]_[BORROW_ASSET]_LTV
// Example: QX_QUSD_LTV means "QX collateral to borrow QUSD"
// Future examples:
// - ETH_QUSD_LTV = 0.80
// - BTC_QUSD_LTV = 0.85
