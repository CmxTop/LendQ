
import Database from './database-memory.js';
import LendQLendingEngine from './lendingEngine.js';

async function reproActiveLoanBug() {
    console.log('🐞 Reproducing Active Loan Display Bug...');
    const engine = new LendQLendingEngine();
    await engine.init();

    const user = await engine.getOrCreateUser('test-repay-user');

    // 1. Deposit and Borrow
    await engine.deposit(user.id, 'QX', 1000);
    await engine.borrow(user.id, 100);
    console.log('Borrowed 100 QUSD');

    // 2. Verify Active Loan
    let position = await engine.getUserPosition(user.id);
    console.log('Active Loans (Before Repay):', position.borrowed.loans.length);

    // 3. Repay Full Amount
    const loans = await engine.db.getUserLoans(user.id);
    const totalDebt = loans.reduce((sum, l) => sum + l.principal + l.interest_accrued, 0);
    await engine.repay(user.id, totalDebt);
    console.log('Repaid Full Debt');

    // 4. Verify Active Loan Count (Should be 0)
    position = await engine.getUserPosition(user.id);
    console.log('Active Loans (After Repay):', position.borrowed.loans.length);

    if (position.borrowed.loans.length > 0) {
        console.error('❌ Bug Confirmed: Repaid loans are still showing up!');
        position.borrowed.loans.forEach(l => {
            console.log(`   - Loan ID: ${l.id}, Total: ${l.total}`);
        });
    } else {
        console.log('✅ No active loans showing.');
    }
}

reproActiveLoanBug().catch(console.error);
