
import Database from './database-memory.js';
import LendQLendingEngine from './lendingEngine.js';

async function reproWithdrawalBug() {
    console.log('🐞 Reproducing Withdrawal Bug...');
    const engine = new LendQLendingEngine();
    await engine.init();

    const user = await engine.getOrCreateUser('test-withdraw-bug-user');

    // 1. Deposit and Borrow
    console.log('\n--- Step 1: Deposit and Borrow ---');
    await engine.deposit(user.id, 'QX', 12000);
    console.log('Deposited 12000 QX');

    await engine.borrow(user.id, 1000);
    console.log('Borrowed 1000 QUSD');

    // 2. Repay Full Amount
    console.log('\n--- Step 2: Repay Full Amount ---');
    const loans = await engine.db.getUserLoans(user.id);
    const totalDebt = loans.reduce((sum, l) => sum + l.principal + l.interest_accrued, 0);
    console.log('Total Debt:', totalDebt);

    await engine.repay(user.id, totalDebt);
    console.log('Repaid Full Debt');

    // 3. Check Borrowed Value
    const borrowedValue = await engine.calculateBorrowedValue(user.id);
    console.log('Borrowed Value after Repay:', borrowedValue);

    if (borrowedValue > 0) {
        console.warn('⚠️ Warning: Borrowed value is not exactly 0:', borrowedValue);
    }

    // 4. Try to Withdraw All Collateral
    console.log('\n--- Step 3: Withdraw All Collateral ---');
    try {
        await engine.withdrawCollateral(user.id, 'QX', 12000);
        console.log('✅ Withdrew 12000 QX successfully');
    } catch (e) {
        console.error('❌ Failed to withdraw:', e.message);
    }
}

reproWithdrawalBug().catch(console.error);
