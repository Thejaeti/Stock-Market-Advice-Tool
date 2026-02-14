import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        border: '1px solid #2a2a3e',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#e0e0f0',
        fontSize: '0.82rem',
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div>
        Composite:{' '}
        <span style={{ color: d.composite >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
          {d.composite > 0 ? '+' : ''}
          {d.composite.toFixed(2)}
        </span>
      </div>
      <div style={{ color: '#8888aa', fontSize: '0.75rem', marginTop: 2 }}>
        {d.source === 'live'
          ? `Full analysis (${d.signalCount} signals)`
          : `Price signals only (${d.signalCount}/6 signals)`}
      </div>
    </div>
  );
}

function LiveDataLabel({ viewBox }) {
  if (!viewBox) return null;
  return (
    <text
      x={viewBox.x + 4}
      y={14}
      fill="#3b82f6"
      fontSize={10}
      fontWeight={600}
    >
      Live
    </text>
  );
}

function InfoTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="convergence-info-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="convergence-info-icon">i</span>
      {open && (
        <div className="convergence-info-popup">
          <div className="convergence-info-title">Backfill vs Live Data</div>
          <div className="convergence-info-section">
            <span className="convergence-info-label backfill">Backfilled</span>
            <p>Computed historically from price data:</p>
            <ul>
              <li><strong>Signal 1</strong> — Trend & Momentum (SMA, RSI, MACD)</li>
              <li><strong>Signal 5</strong> — Volatility & Drawdown</li>
            </ul>
          </div>
          <div className="convergence-info-section">
            <span className="convergence-info-label live">Live only</span>
            <p>Requires a full analysis run (cannot be backfilled):</p>
            <ul>
              <li><strong>Signal 2</strong> — Fundamentals</li>
              <li><strong>Signal 3</strong> — Analyst Consensus</li>
              <li><strong>Signal 4</strong> — Insider Activity</li>
              <li><strong>Signal 5</strong> — Beta & Debt (partial)</li>
              <li><strong>Signal 6</strong> — AI Thesis Alignment</li>
            </ul>
          </div>
          <p className="convergence-info-note">
            The blue "Live" marker shows when full analysis data begins.
            Scores accumulate as you re-analyze over time.
          </p>
        </div>
      )}
    </span>
  );
}

export default function ConvergenceChart({ data, ticker }) {
  if (!data || data.length === 0) return null;

  // Split into positive and negative for dual-fill areas
  const chartData = data.map((d) => ({
    ...d,
    pos: d.composite >= 0 ? d.composite : 0,
    neg: d.composite < 0 ? d.composite : 0,
  }));

  const lastComposite = data[data.length - 1].composite;
  const strokeColor = lastComposite >= 0 ? '#22c55e' : '#ef4444';

  // Find first live entry date
  const firstLive = data.find((d) => d.source === 'live');
  const firstLiveDate = firstLive ? firstLive.date : null;

  return (
    <div className="convergence-chart">
      <div className="convergence-chart-header">
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          {ticker} — Convergence Score Timeline
        </h3>
        <InfoTooltip />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="convGradPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="convGradNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
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
            domain={[-4, 4]}
            tick={{ fill: '#8888aa', fontSize: 11 }}
            tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#8888aa" strokeDasharray="3 3" strokeOpacity={0.5} />
          {firstLiveDate && (
            <ReferenceLine
              x={firstLiveDate}
              stroke="#3b82f6"
              strokeDasharray="6 3"
              strokeOpacity={0.7}
              label={<LiveDataLabel />}
            />
          )}
          <Area
            type="monotone"
            dataKey="pos"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#convGradPos)"
            baseValue={0}
            isAnimationActive={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="neg"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#convGradNeg)"
            baseValue={0}
            isAnimationActive={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
