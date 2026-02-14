import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function PriceChart({ data, ticker }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((d) => ({
    date: d.date,
    price: d.close,
  }));

  const prices = chartData.map((d) => d.price);
  const min = Math.floor(Math.min(...prices) * 0.98);
  const max = Math.ceil(Math.max(...prices) * 1.02);

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isUp = lastPrice >= firstPrice;

  return (
    <div className="price-chart">
      <h3 className="section-title">{ticker} — 90 Day Price</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8888aa', fontSize: 11 }}
            tickFormatter={(d) => {
              const parts = d.split('-');
              return `${parts[1]}/${parts[2]}`;
            }}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: '#8888aa', fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: 8,
              color: '#e0e0f0',
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isUp ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
