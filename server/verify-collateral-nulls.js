
import Database from './database-memory.js';
import LendQLendingEngine from './lendingEngine.js';

async function verifyCollateralNulls() {
    console.log('🧪 Verifying Collateral Withdrawal & Null Values...');
    const engine = new LendQLendingEngine();
    await engine.init();

    const user = await engine.getOrCreateUser('test-verify-user');

    // 1. Setup: Deposit and Borrow
    console.log('\n--- Setup ---');
    await engine.deposit(user.id, 'QX', 1000); // 1000 QX = $1000
    console.log('Deposited 1000 QX');

    await engine.borrow(user.id, 7500); // Borrow Max LTV (75% of 10000)
    console.log('Borrowed 7500 QUSD');

    // 2. Test Unsafe Withdrawal
    console.log('\n--- Test 1: Unsafe Collateral Withdrawal ---');
    try {
        await engine.withdrawCollateral(user.id, 'QX', 100);
        console.error('❌ CRITICAL: Withdrew 100 QX (should be blocked)!');
    } catch (e) {
        console.log('✅ Withdrawal blocked:', e.message);
    }

    // 3. Test Null Values in Position
    console.log('\n--- Test 2: Null Values in Position ---');
    const position = await engine.getUserPosition(user.id);
    console.log('Position Borrowed Total:', position.borrowed.total);
    console.log('Position Available To Borrow:', position.availableToBorrow);

    if (position.borrowed.total === null || isNaN(position.borrowed.total)) {
        console.error('❌ Borrowed total is NULL or NaN!');
    } else {
        console.log('✅ Borrowed total is valid number:', position.borrowed.total);
    }

    if (position.availableToBorrow === null || isNaN(position.availableToBorrow)) {
        console.error('❌ Available to borrow is NULL or NaN!');
    } else {
        console.log('✅ Available to borrow is valid number:', position.availableToBorrow);
    }

    const loan = position.borrowed.loans[0];
    if (loan) {
        if (loan.interest === null || isNaN(loan.interest)) {
            console.error('❌ Loan interest is NULL or NaN!');
        } else {
            console.log('✅ Loan interest is valid number:', loan.interest);
        }
    }
}

verifyCollateralAndNulls().catch(console.error);
