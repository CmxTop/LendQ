
import Database from './database-memory.js';
import AaveLendingEngine from './lendingEngine.js';

async function testFixes() {
    console.log('🧪 Testing Bug Fixes...');
    const engine = new AaveLendingEngine();
    await engine.init();

    // Setup user
    const user = await engine.getOrCreateUser('test-fix-user');

    // Test 1: Supply Crash Fix
    console.log('\nTest 1: Supply Crash Fix');
    try {
        await engine.supply(user.id, 100);
        console.log('✅ Supply successful (no crash)');
    } catch (e) {
        console.error('❌ Supply failed:', e.message);
    }

    // Test 2: Repayment Overpayment
    console.log('\nTest 2: Repayment Overpayment');
    try {
        // Need to borrow first
        await engine.deposit(user.id, 'QX', 100);
        await engine.borrow(user.id, 50);

        // Try to repay 100 (more than 50)
        await engine.repay(user.id, 100);
        console.error('❌ Repayment overpayment failed (should have thrown error)');
    } catch (e) {
        if (e.message.includes('exceeds total debt')) {
            console.log('✅ Repayment overpayment blocked correctly:', e.message);
        } else {
            console.error('❌ Unexpected error during repayment:', e.message);
        }
    }

    // Test 3: Collateral Withdrawal
    console.log('\nTest 3: Collateral Withdrawal');
    try {
        // User has 100 QX deposited, 50 QUSD borrowed (approx)
        // LTV is 0.75. Collateral value = 100 * 10 = 1000 USD.
        // Max borrow = 750 USD. Borrowed = 50 USD.
        // Can withdraw?
        // Remaining collateral must be >= Borrowed / LTV
        // Min Collateral = 50 / 0.75 = 66.66 USD = 6.66 QX.
        // So can withdraw up to 100 - 6.66 = 93.33 QX.

        // Try withdrawing 95 QX (should fail)
        try {
            await engine.withdrawCollateral(user.id, 'QX', 95);
            console.error('❌ Unsafe withdrawal allowed');
        } catch (e) {
            console.log('✅ Unsafe withdrawal blocked:', e.message);
        }

        // Try withdrawing 10 QX (should succeed)
        await engine.withdrawCollateral(user.id, 'QX', 10);
        const deposits = await engine.getUserDeposits(user.id, 'QX');
        if (deposits === 90) {
            console.log('✅ Safe withdrawal successful. Remaining:', deposits);
        } else {
            console.error('❌ Withdrawal amount incorrect. Remaining:', deposits);
        }

    } catch (e) {
        console.error('❌ Collateral withdrawal test error:', e);
    }
}

testFixes().catch(console.error);
