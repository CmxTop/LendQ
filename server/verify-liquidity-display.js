
import Database from './database-memory.js';
import LendQLendingEngine from './lendingEngine.js';

async function verifyLiquidityDisplay() {
    console.log('🧪 Verifying Liquidity Display...');
    const engine = new LendQLendingEngine();
    await engine.init();

    const user = await engine.getOrCreateUser('test-liquidity-user');

    // 1. Supply Liquidity
    console.log('\n--- Step 1: Supply Liquidity ---');
    await engine.supply(user.id, 1000);
    console.log('Supplied 1000 QUSD');

    let position = await engine.getUserPosition(user.id);
    console.log('Initial Position:', JSON.stringify(position.supplied, null, 2));

    if (position.supplied.principal !== 1000) console.error('❌ Principal mismatch!');
    if (position.supplied.interestEarned !== 0) console.error('❌ Interest Earned mismatch!');

    // 2. Simulate Interest Accrual
    console.log('\n--- Step 2: Simulate Interest Accrual ---');
    const supplies = await engine.db.getUserSupplies(user.id);
    const supply = supplies[0];

    // Hack: manually set last_accrual_ts to past
    supply.last_accrual_ts = new Date(Date.now() - 10000000); // 10000s ago
    await engine.db.updateSupply(supply.id, { last_accrual_ts: supply.last_accrual_ts });

    await engine.accrueSupplyInterest(supply);
    console.log('Supply Interest Accrued');

    // 3. Check Position again
    position = await engine.getUserPosition(user.id);
    console.log('Position (After Accrual):', JSON.stringify(position.supplied, null, 2));

    if (position.supplied.principal !== 1000) {
        console.error('❌ Principal changed!');
    } else {
        console.log('✅ Principal remains 1000');
    }

    if (position.supplied.interestEarned > 0) {
        console.log('✅ Interest Earned > 0:', position.supplied.interestEarned);
    } else {
        console.error('❌ Interest Earned is 0!');
    }

    if (Math.abs(position.supplied.total - (position.supplied.principal + position.supplied.interestEarned)) < 0.000001) {
        console.log('✅ Total = Principal + Interest');
    } else {
        console.error('❌ Total mismatch!');
    }
}

verifyLiquidityDisplay().catch(console.error);
