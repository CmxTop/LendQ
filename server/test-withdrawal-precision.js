
import Database from './database-memory.js';
import LendQLendingEngine from './lendingEngine.js';

async function reproPrecisionBug() {
    console.log('🐞 Reproducing Withdrawal Precision Bug...');
    const engine = new LendQLendingEngine();
    await engine.init();

    const user = await engine.getOrCreateUser('test-precision-user');

    // 1. Deposit 2000 QX (Value: $20,000)
    // LTV is 0.75, so Max Borrow = $15,000
    await engine.deposit(user.id, 'QX', 2000);
    console.log('Deposited 2000 QX ($20,000)');

    // 2. Borrow Max Amount ($15,000)
    // Actually borrow slightly less to allow for some withdrawal, then try to withdraw exactly to the limit
    await engine.borrow(user.id, 7500);
    console.log('Borrowed 7500 QUSD');

    // Current Collateral: 2000 QX ($20,000)
    // Borrowed: 7500
    // Required Collateral for 7500 debt = 7500 / 0.75 = $10,000 (1000 QX)
    // So we should be able to withdraw 1000 QX.

    // 3. Try to Withdraw exactly 1000 QX
    console.log('\n--- Attempting to withdraw 1000 QX ---');
    try {
        await engine.withdrawCollateral(user.id, 'QX', 1000);
        console.log('✅ Withdrew 1000 QX successfully');
    } catch (e) {
        console.error('❌ Failed to withdraw:', e.message);
    }
}

reproPrecisionBug().catch(console.error);
