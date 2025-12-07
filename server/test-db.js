
import Database from './database-memory.js';

async function testDatabase() {
    console.log('🧪 Testing Database Adapter...');
    const db = new Database();
    await db.init();

    // Test 1: getUserSupplies
    console.log('\nTest 1: getUserSupplies');
    const user = await db.createUser('test-wallet');
    await db.createSupply(user.id, 1, 100);
    const supplies = await db.getUserSupplies(user.id);
    if (supplies.length === 1 && supplies[0].amount === 100) {
        console.log('✅ getUserSupplies passed');
    } else {
        console.error('❌ getUserSupplies failed', supplies);
    }

    // Test 2: updateLoan
    console.log('\nTest 2: updateLoan');
    const loan = await db.createLoan(user.id, 1, 50);
    await db.updateLoan(loan.id, { interest_accrued: 5 });
    const updatedLoan = (await db.getUserLoans(user.id))[0];
    if (updatedLoan.interest_accrued === 5) {
        console.log('✅ updateLoan passed');
    } else {
        console.error('❌ updateLoan failed', updatedLoan);
    }

    // Test 3: updateSupply
    console.log('\nTest 3: updateSupply');
    const supply = supplies[0];
    await db.updateSupply(supply.id, { interest_earned: 2 });
    const updatedSupply = (await db.getUserSupplies(user.id))[0];
    if (updatedSupply.interest_earned === 2) {
        console.log('✅ updateSupply passed');
    } else {
        console.error('❌ updateSupply failed', updatedSupply);
    }

    // Test 4: updateLoansForUser
    console.log('\nTest 4: updateLoansForUser');
    await db.updateLoansForUser(user.id, { status: 'liquidated' });
    const liquidatedLoan = (await db.getAllActiveLoans()).find(l => l.id === loan.id);
    // Note: getAllActiveLoans filters by status='active', so it should NOT find it
    if (!liquidatedLoan) {
        console.log('✅ updateLoansForUser passed (loan no longer active)');
    } else {
        console.error('❌ updateLoansForUser failed', liquidatedLoan);
    }
}

testDatabase().catch(console.error);
