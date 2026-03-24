export interface Transaction {
    from: string;
    to: string;
    amount: number;
}

const PRECISION = 100;

export function simplifyDebts(
    splits: { paidBy: string; owedBy: string; amount: number }[]
): Transaction[] {
    const balance = new Map<string, number>();
    const credit = (id: string, delta: number) =>
        balance.set(id, (balance.get(id) ?? 0) + delta);

    for (const { paidBy, owedBy, amount } of splits) {
        if (paidBy === owedBy || amount <= 0) continue;
        credit(paidBy, +amount);
        credit(owedBy, -amount);
    }

    const pos: { id: string; units: number }[] = [];
    const neg: { id: string; units: number }[] = [];

    for (const [id, net] of balance) {
        const units = Math.round(net * PRECISION);
        if (units > 0) pos.push({ id, units });
        else if (units < 0) neg.push({ id, units: -units });
    }

    pos.sort((a, b) => b.units - a.units);
    neg.sort((a, b) => b.units - a.units);

    const transactions: Transaction[] = [];
    let p = 0;
    let n = 0;

    while (p < pos.length && n < neg.length) {
        const creditor = pos[p];
        const debtor = neg[n];
        const settled = Math.min(creditor.units, debtor.units);

        transactions.push({
            from: debtor.id,
            to: creditor.id,
            amount: settled / PRECISION,
        });

        creditor.units -= settled;
        debtor.units -= settled;

        if (creditor.units === 0) p++;
        if (debtor.units === 0) n++;
    }

    return transactions;
}
