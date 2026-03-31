import { useState, useEffect, useCallback } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CURRENCIES = [
    "EUR",
    "USD",
    "GBP",
    "JPY",
    "CHF",
    "CAD",
    "AUD",
    "NZD",
    "CNY",
    "HKD",
    "SGD",
    "THB",
    "TRY",
    "SEK",
    "NOK",
    "DKK",
    "PLN",
    "CZK",
    "HUF",
    "RON",
    "BGN",
    "HRK",
    "ISK",
    "RUB",
    "UAH",
    "BRL",
    "MXN",
    "ARS",
    "CLP",
    "COP",
    "INR",
    "IDR",
    "MYR",
    "PHP",
    "KRW",
    "TWD",
    "VND",
    "ZAR",
    "EGP",
    "MAD",
    "NGN",
    "KES",
    "AED",
    "SAR",
    "QAR",
    "KWD",
    "BHD",
    "OMR",
    "ILS",
];

export function CurrencyWidget() {
    const [from, setFrom] = useState(
        () => localStorage.getItem("currency_from") || "EUR"
    );
    const [to, setTo] = useState(
        () => localStorage.getItem("currency_to") || "USD"
    );
    const [amount, setAmount] = useState("100");
    const [rate, setRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchRate = useCallback(async () => {
        if (from === to) {
            setRate(1);
            return;
        }
        setLoading(true);
        try {
            const resp = await fetch(
                `https://api.exchangerate-api.com/v4/latest/${from}`
            );
            const data = await resp.json();
            setRate(data.rates?.[to] || null);
        } catch {
            setRate(null);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        fetchRate();
    }, [fetchRate]);
    useEffect(() => {
        localStorage.setItem("currency_from", from);
    }, [from]);
    useEffect(() => {
        localStorage.setItem("currency_to", to);
    }, [to]);

    const swap = () => {
        setFrom(to);
        setTo(from);
    };

    const rawResult =
        rate && amount ? (parseFloat(amount) * rate).toFixed(2) : null;

    const formatNumber = (num: string | null) => {
        if (!num) return "—";
        return parseFloat(num).toLocaleString("de-DE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    return (
        <Card className="rounded-2xl">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Currency
                    </span>
                    <Button variant="ghost" size="icon" aria-label="Refresh rate" onClick={fetchRate}>
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                    </Button>
                </div>
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 text-2xl font-black"
                />
                <div className="flex items-center gap-2">
                    <Select
                        value={from}
                        onValueChange={(value) => value && setFrom(value)}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {CURRENCIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" aria-label="Swap currencies" className="transition-colors" onClick={swap}>
                        <ArrowRightLeft size={14} />
                    </Button>
                    <Select
                        value={to}
                        onValueChange={(value) => value && setTo(value)}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {CURRENCIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="rounded-xl bg-muted p-3">
                    <p className="text-xl font-black tabular-nums">
                        {formatNumber(rawResult)}{" "}
                        <span className="text-sm font-semibold text-muted-foreground">
                            {to}
                        </span>
                    </p>
                    {rate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            1 {from} = {rate.toFixed(4)} {to}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
