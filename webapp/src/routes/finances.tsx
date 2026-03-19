import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  subscribeToAllCashRequests,
  recordToArray,
  type DBCashRequest,
} from "@/lib/firebase-db";
import { useToast } from "@/hooks/use-toast";
import {
    Download,
    TrendingUp,
    PieChart as PieChartIcon,
    Wallet,
    CreditCard,
    Banknote,
    DollarSign,
    CalendarRange
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Types
interface TrendData {
    date: string;
    amount: number;
}

interface CategoryData {
    name: string;
    amount: number;
    count: number;
}

interface MethodData {
    method: string;
    amount: number;
    count: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function FinancesPage() {
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [methods, setMethods] = useState<MethodData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsub = subscribeToAllCashRequests((data) => {
            const all = recordToArray(data).filter(r => r.status === "APPROVED");

            // Compute category breakdown
            const catMap = new Map<string, { amount: number; count: number }>();
            const methodMap = new Map<string, { amount: number; count: number }>();
            const trendMap = new Map<string, number>();

            all.forEach(r => {
                const catName = r.categoryName || "Uncategorized";
                const existing = catMap.get(catName) || { amount: 0, count: 0 };
                catMap.set(catName, { amount: existing.amount + r.amount, count: existing.count + 1 });

                const method = r.payoutMethod || "CASH";
                const mExisting = methodMap.get(method) || { amount: 0, count: 0 };
                methodMap.set(method, { amount: mExisting.amount + r.amount, count: mExisting.count + 1 });

                const day = r.createdAt.split("T")[0];
                trendMap.set(day, (trendMap.get(day) || 0) + r.amount);
            });

            setCategories(Array.from(catMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount));
            setMethods(Array.from(methodMap.entries()).map(([method, v]) => ({ method, ...v })));

            const sortedDays = Array.from(trendMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
            setTrends(sortedDays.map(([date, amount]) => ({ date, amount })));

            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const headers = ["Category", "Amount", "Count"];
            const rows = categories.map(c => [c.name, c.amount.toString(), c.count.toString()]);
            const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Success", description: "Report downloaded successfully" });
        } catch (e) {
            toast({ title: "Error", description: "Failed to export report", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    const formatCurrency = (val: number) => `GH₵${val.toLocaleString()}`;

    const totalSpend = categories.reduce((sum, item) => sum + item.amount, 0);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-full w-full bg-[#020617] text-white p-6 md:p-8 space-y-8 animate-in fade-in duration-700">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-200">
                            Financial Overview
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl font-light">
                            Real-time financial intelligence and cash flow analytics for <span className="text-blue-400 font-medium">Dewaks Engineering</span>.
                        </p>
                    </div>

                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] border border-blue-400/20 active:scale-95 transition-all duration-200"
                    >
                        {isExporting ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                <span>Generating Report...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Download className="w-5 h-5" />
                                <span>Export Financial Report</span>
                            </div>
                        )}
                    </Button>
                </div>

                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Spend Card */}
                    <div className="relative group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B1121] transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative p-7 flex flex-col justify-between h-full min-h-[160px]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                    <DollarSign className="w-7 h-7" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10">
                                    <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">All Time</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Total Approved Spend</p>
                                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight text-shadow-sm">{formatCurrency(totalSpend)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trend Card */}
                    <div className="relative group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B1121] transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative p-7 flex flex-col justify-between h-full min-h-[160px]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                    <CalendarRange className="w-7 h-7" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/10">
                                    <span className="text-xs font-bold text-blue-400 tracking-wide uppercase">Last 30 Days</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Monthly Volume</p>
                                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight text-shadow-sm">{formatCurrency(trends.reduce((a, b) => a + b.amount, 0))}</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Category Card */}
                    <div className="relative group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B1121] transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative p-7 flex flex-col justify-between h-full min-h-[160px]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                    <Banknote className="w-7 h-7" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/10">
                                    <span className="text-xs font-bold text-purple-400 tracking-wide uppercase">Highest Spend</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Top Category</p>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-2xl font-bold text-white tracking-tight truncate max-w-[180px]" title={categories[0]?.name}>{categories[0]?.name || "N/A"}</p>
                                    <span className="text-sm font-semibold text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                        {categories[0] ? ((categories[0].amount / totalSpend) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{formatCurrency(categories[0]?.amount || 0)} total</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Spending Trend Chart */}
                    <div className="xl:col-span-2 rounded-3xl border border-white/[0.08] bg-[#0B1121] p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <TrendingUp className="w-48 h-48 text-white" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Spending Velocity
                            </h3>
                            <p className="text-slate-400 text-sm mb-8">Daily expenditure tracking for the last 30 days</p>

                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAmountBlue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                            stroke="#64748b"
                                            fontSize={12}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickFormatter={(val) => `GH₵${val / 1000}k`}
                                            axisLine={false}
                                            tickLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#334155',
                                                color: '#f8fafc',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                            }}
                                            itemStyle={{ color: '#60a5fa' }}
                                            formatter={(val: number) => [formatCurrency(val), 'Amount']}
                                            labelFormatter={(label) => format(new Date(label), 'EEEE, MMMM d, yyyy')}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fill="url(#colorAmountBlue)"
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#60a5fa' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown & Methods Column */}
                    <div className="space-y-6">

                        {/* Payment Methods */}
                        <div className="rounded-3xl border border-white/[0.08] bg-[#0B1121] p-6 relative overflow-hidden">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                <Wallet className="w-5 h-5 text-emerald-500" />
                                Payment Distribution
                            </h3>
                            <div className="space-y-5">
                                {methods.map((method, index) => (
                                    <div key={method.method} className="group cursor-default">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <div className="flex items-center gap-2.5 text-slate-300 group-hover:text-white transition-colors">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg bg-white/5 border border-white/5",
                                                    method.method === 'MOMO' && "text-orange-400 group-hover:bg-orange-500/10 group-hover:border-orange-500/20",
                                                    method.method === 'CASH' && "text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20",
                                                    method.method === 'BANK_TRANSFER' && "text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/20",
                                                )}>
                                                    {method.method === 'MOMO' && <CreditCard className="w-3.5 h-3.5" />}
                                                    {method.method === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                                                    {method.method === 'BANK_TRANSFER' && <Wallet className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className="font-medium">{method.method.replace('_', ' ')}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-white block">{formatCurrency(method.amount)}</span>
                                            </div>
                                        </div>
                                        <div className="relative h-2.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 relative",
                                                    method.method === 'MOMO' && "bg-gradient-to-r from-orange-500 to-amber-500",
                                                    method.method === 'CASH' && "bg-gradient-to-r from-emerald-500 to-teal-400",
                                                    method.method === 'BANK_TRANSFER' && "bg-gradient-to-r from-blue-500 to-cyan-400",
                                                )}
                                                style={{ width: `${(method.amount / totalSpend) * 100}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] overflow-hidden" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {methods.length === 0 && <p className="text-slate-500 text-center py-4">No data available</p>}
                            </div>
                        </div>

                        {/* Category Pie Chart */}
                        <div className="rounded-3xl border border-white/[0.08] bg-[#0B1121] p-6 flex flex-col items-center justify-center min-h-[300px]">
                            <h3 className="text-lg font-bold text-white mb-2 self-start flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-purple-500" />
                                Categorical Split
                            </h3>
                            <div className="h-[250px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="amount"
                                            stroke="none"
                                        >
                                            {categories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                            formatter={(val: number) => formatCurrency(val)}
                                        />
                                        <Legend
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            content={({ payload }) => (
                                                <ul className="space-y-1">
                                                    {payload?.slice(0, 5).map((entry: any, index: number) => (
                                                        <li key={`item-${index}`} className="flex items-center text-xs text-slate-300">
                                                            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                                                            <span className="truncate max-w-[80px]" title={entry.value}>{entry.value}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
