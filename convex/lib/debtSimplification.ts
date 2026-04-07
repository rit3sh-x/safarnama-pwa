export interface Transaction {
    from: string;
    to: string;
    amount: number;
}

export interface BalanceEntry {
    id: string;
    net: number;
}

const PRECISION = 100;

export function computeNetBalances(
    debts: { from: string; to: string; amount: number }[]
): BalanceEntry[] {
    const balanceUnits = new Map<string, number>();
    const credit = (id: string, delta: number) =>
        balanceUnits.set(id, (balanceUnits.get(id) ?? 0) + delta);

    for (const { from, to, amount } of debts) {
        if (from === to || amount <= 0) continue;
        const units = Math.round(amount * PRECISION);
        credit(to, +units);
        credit(from, -units);
    }

    const result: BalanceEntry[] = [];
    for (const [id, units] of balanceUnits) {
        if (Math.abs(units) < 0.1) continue;
        result.push({ id, net: units / PRECISION });
    }
    return result;
}

export function computePairwiseDebts(
    debts: { from: string; to: string; amount: number }[]
): Transaction[] {
    const pairUnits = new Map<string, number>();

    for (const { from, to, amount } of debts) {
        if (from === to || amount <= 0) continue;
        const units = Math.round(amount * PRECISION);
        const [lo, hi] = from < to ? [from, to] : [to, from];
        const sign = from < to ? 1 : -1;
        const key = `${lo}|${hi}`;
        pairUnits.set(key, (pairUnits.get(key) ?? 0) + sign * units);
    }

    const transactions: Transaction[] = [];
    for (const [key, net] of pairUnits) {
        if (net === 0) continue;
        const [lo, hi] = key.split("|");
        if (net > 0) {
            transactions.push({ from: lo, to: hi, amount: net / PRECISION });
        } else {
            transactions.push({ from: hi, to: lo, amount: -net / PRECISION });
        }
    }
    return transactions;
}

export function simplifyDebts(
    debts: { from: string; to: string; amount: number }[]
): Transaction[] {
    const balances = computeNetBalances(debts);
    const nonZero = balances.filter((b) => Math.abs(b.net) >= 0.001);

    if (nonZero.length === 0) return [];

    if (nonZero.length <= 14) {
        return bitmaskDPSimplify(nonZero);
    }
    return greedySimplify(nonZero);
}

export function bitmaskDPSimplify(balances: BalanceEntry[]): Transaction[] {
    const N = balances.length;
    const units = balances.map((b) => Math.round(b.net * PRECISION));

    const total = 1 << N;

    const subsetSum = new Int32Array(total);
    for (let mask = 1; mask < total; mask++) {
        const lsb = mask & -mask;
        const bit = Math.log2(lsb);
        subsetSum[mask] = subsetSum[mask ^ lsb] + units[bit];
    }

    const isZeroSum = new Uint8Array(total);
    for (let mask = 1; mask < total; mask++) {
        if (subsetSum[mask] === 0 && popcount(mask) >= 2) {
            isZeroSum[mask] = 1;
        }
    }

    const maxPartitions = new Int32Array(total).fill(0);
    for (let mask = 1; mask < total; mask++) {
        if (!isZeroSum[mask]) continue;
        maxPartitions[mask] = Math.max(maxPartitions[mask], 1);
        for (let sub = (mask - 1) & mask; sub > 0; sub = (sub - 1) & mask) {
            if (isZeroSum[sub]) {
                const rest = mask ^ sub;
                if (maxPartitions[rest] > 0) {
                    const val = maxPartitions[sub] + maxPartitions[rest];
                    if (val > maxPartitions[mask]) {
                        maxPartitions[mask] = val;
                    }
                }
            }
        }
    }

    const fullMask = total - 1;
    const partitions: number[][] = [];
    let remaining = fullMask;

    while (remaining !== 0) {
        let bestSub = 0;
        let bestCount = Infinity;
        for (let sub = remaining; sub > 0; sub = (sub - 1) & remaining) {
            if (isZeroSum[sub]) {
                const pc = popcount(sub);
                if (maxPartitions[sub] === 1 && pc < bestCount) {
                    bestSub = sub;
                    bestCount = pc;
                }
            }
        }

        if (bestSub === 0) {
            const leftover: BalanceEntry[] = [];
            for (let i = 0; i < N; i++) {
                if (remaining & (1 << i)) leftover.push(balances[i]);
            }
            return [
                ...partitions.flatMap((p) => settlePartition(p, balances)),
                ...greedySimplify(leftover),
            ];
        }

        const members: number[] = [];
        for (let i = 0; i < N; i++) {
            if (bestSub & (1 << i)) members.push(i);
        }
        partitions.push(members);
        remaining ^= bestSub;
    }

    return partitions.flatMap((members) => settlePartition(members, balances));
}

function settlePartition(
    members: number[],
    balances: BalanceEntry[]
): Transaction[] {
    const entries = members.map((i) => ({
        id: balances[i].id,
        units: Math.round(balances[i].net * PRECISION),
    }));
    return greedySimplify(
        entries.map((e) => ({ id: e.id, net: e.units / PRECISION }))
    );
}

export function greedySimplify(balances: BalanceEntry[]): Transaction[] {
    const creditors: { id: string; units: number }[] = [];
    const debtors: { id: string; units: number }[] = [];

    for (const { id, net } of balances) {
        const units = Math.round(net * PRECISION);
        if (units > 0) creditors.push({ id, units });
        else if (units < 0) debtors.push({ id, units: -units });
    }

    creditors.sort((a, b) => b.units - a.units);
    debtors.sort((a, b) => b.units - a.units);

    const transactions: Transaction[] = [];
    let p = 0;
    let d = 0;

    while (p < creditors.length && d < debtors.length) {
        const creditor = creditors[p];
        const debtor = debtors[d];
        const settled = Math.min(creditor.units, debtor.units);

        transactions.push({
            from: debtor.id,
            to: creditor.id,
            amount: settled / PRECISION,
        });

        creditor.units -= settled;
        debtor.units -= settled;

        if (creditor.units === 0) p++;
        if (debtor.units === 0) d++;
    }

    return transactions;
}

function popcount(x: number): number {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0f0f0f0f;
    return (x * 0x01010101) >>> 24;
}
