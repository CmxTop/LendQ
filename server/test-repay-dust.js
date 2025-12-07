
import Database from './database-memory.js';
import LendQLendingEngine from './lendingEngine.js';

async function reproDustBug() {
    console.log('🐞 Reproducing Dust Loan Bug...');
    const engine = new LendQLendingEngine();
    await engine.init();

    const user = await engine.getOrCreateUser('test-dust-user');

    // 1. Create a loan and manually set it to dust state
    await engine.deposit(user.id, 'QX', 1000);
    await engine.borrow(user.id, 100);

    const loans = await engine.db.getUserLoans(user.id);
    const loan = loans[0];

    // Manually set principal to dust
    await engine.db.updateLoan(loan.id, { principal: 0.0000001, interest_accrued: 0 });
    console.log('Manually set loan to dust: 0.0000001 QUSD');

    // 2. Verify it shows as active
    let position = await engine.getUserPosition(user.id);
    console.log('Active Loans (Dust):', position.borrowed.loans.length);
    console.log('Loan Total:', position.borrowed.loans[0].total);

    // 3. Try to repay "0.01" (min amount user might try)
    console.log('Repaying 0.01 QUSD...');
    await engine.repay(user.id, 0.01);

    // 4. Verify it is cleared
    position = await engine.getUserPosition(user.id);
    console.log('Active Loans (After Repay):', position.borrowed.loans.length);

    if (position.borrowed.loans.length === 0) {
        console.log('✅ Dust loan successfully cleared!');
    } else {
        console.error('❌ Dust loan still active!');
    }
}

reproDustBug().catch(console.error);
