import React, { useEffect, useMemo, useState } from 'react';

const TENURE_OPTIONS = [
  { key: 'RAPID', label: 'Rapid', months: 1 },
  { key: 'E3', label: 'E3', months: 3 },
  { key: 'E6', label: 'E6', months: 6 },
  { key: 'E9', label: 'E9', months: 9 },
  { key: 'E12', label: 'E12', months: 12 },
];

function getAllowedTenuresByDisbursement(disbursementAmount) {
  const d = Number(disbursementAmount || 0);
  if (d <= 0) return [];
  if (d <= 5000) return ['RAPID', 'E3'];
  if (d <= 10000) return ['RAPID', 'E3', 'E6'];
  if (d <= 30000) return ['RAPID', 'E3', 'E6', 'E9'];
  return ['RAPID', 'E3', 'E6', 'E9', 'E12'];
}

function getMinimumDownPayment(itemValue) {
  const num = Number(itemValue || 0);
  if (num <= 0) return 0;
  if (num >= 10000 && num <= 20000) return Math.ceil(num * 0.3);
  if (num >= 20001 && num <= 35000) return Math.ceil(num * 0.3);
  if (num >= 35001 && num <= 50000) return Math.ceil(num * 0.25);
  if (num >= 50001) return Math.ceil(num * 0.2);
  return 0;
}

function diffInDays(startDate, endDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.max(0, Math.round((end - start) / msPerDay));
}

function getNextEmiDate(baseDate) {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const day = d.getDate();

  let targetMonth = d.getMonth() + 1;
  let targetDay;

  if (day <= 10) targetDay = 10;
  else if (day <= 20) targetDay = 20;
  else {
    targetDay = 1;
    targetMonth += 1;
  }

  return new Date(d.getFullYear(), targetMonth, targetDay);
}

function calculateEmiOptions(itemValue, downPayment, deviceType = 'ANDROID') {
  const item = Number(itemValue || 0);
  const down = Number(downPayment || 0);
  const disbursementAmount = Math.max(item - down, 0);

  if (disbursementAmount <= 0) return [];

  const AV_FEE = 200;
  const LOCK_FEE = deviceType === 'IOS' ? 400 : 150;
  const gross = disbursementAmount + AV_FEE + LOCK_FEE;
  const loanAmount = Math.ceil((gross * 100) / 90);
  const processingFee = Math.round(loanAmount * 0.1);

  const allowedKeys = getAllowedTenuresByDisbursement(disbursementAmount);
  if (allowedKeys.length === 0) return [];

  const today = new Date();
  const filteredTenures = TENURE_OPTIONS.filter((t) => allowedKeys.includes(t.key));
  const dailyRate = 0.00065753424658;

  return filteredTenures.map((t) => {
    const months = t.months;
    const schedule = [];
    let emiDate = getNextEmiDate(today);

    for (let i = 0; i < months; i += 1) {
      schedule.push(new Date(emiDate));
      emiDate = new Date(emiDate.getFullYear(), emiDate.getMonth() + 1, emiDate.getDate());
    }

    const firstDate = schedule[0];
    const lastDate = schedule[schedule.length - 1];
    const days = diffInDays(today, lastDate);
    const interest = loanAmount * dailyRate * days;
    const totalRepay = loanAmount + interest;
    const emi = Math.ceil(totalRepay / months);

    return {
      key: t.key,
      label: t.label,
      months,
      days,
      loanAmount,
      netDisbursement: disbursementAmount,
      emi,
      processingFee,
      interest,
      totalRepay,
      firstEmiDate: firstDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      lastRepaymentDate: lastDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      avFee: AV_FEE,
      appLockFee: LOCK_FEE,
    };
  });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function EmiCalculatorPage() {
  const [form, setForm] = useState({
    itemValue: '',
    downPayment: '',
    deviceType: 'ANDROID',
  });

  const [error, setError] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const itemValueNum = Number(form.itemValue || 0);
  const downPaymentNum = Number(form.downPayment || 0);
  const disbursementAmount = Math.max(itemValueNum - downPaymentNum, 0);
  const minDownPayment = useMemo(() => getMinimumDownPayment(form.itemValue), [form.itemValue]);

  const emiOptions = useMemo(() => {
    if (!hasCalculated) return [];
    return calculateEmiOptions(form.itemValue, form.downPayment, form.deviceType);
  }, [hasCalculated, form.itemValue, form.downPayment, form.deviceType]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'itemValue') {
        const autoDp = getMinimumDownPayment(value);
        next.downPayment = autoDp ? String(autoDp) : '';
      }

      return next;
    });
  };

  const handleDeviceTypeChange = (type) => {
    setForm((prev) => ({ ...prev, deviceType: type }));
  };

  const handleCalculate = () => {
    const item = Number(form.itemValue || 0);
    const down = Number(form.downPayment || 0);

    if (!item || item <= 0) {
      setError('Enter a valid item value.');
      setHasCalculated(false);
      return;
    }

    if (!down || down <= 0) {
      setError('Enter a valid downpayment.');
      setHasCalculated(false);
      return;
    }

    if (down > item) {
      setError('Downpayment cannot be more than item value.');
      setHasCalculated(false);
      return;
    }

    if (minDownPayment && down < minDownPayment) {
      setError(`Minimum downpayment required is ${formatMoney(minDownPayment)}.`);
      setHasCalculated(false);
      return;
    }

    setError('');
    setHasCalculated(true);
  };

  const handleReset = () => {
    setForm({
      itemValue: '',
      downPayment: '',
      deviceType: 'ANDROID',
    });
    setHasCalculated(false);
    setError('');
  };

  return (
    <section className="page-section">
      <h2 className="page-title">EMI Calculator</h2>

      <div className="info-card" style={{ marginBottom: 16 }}>
        <span className="info-card__label">Quick calculation</span>
        <p className="muted-text" style={{ marginTop: 6 }}>
          Check EMI plans using item value, downpayment, and device type.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: '#fdecea',
            color: '#b71c1c',
            border: '1px solid #f5c2c7',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        className="info-card"
        style={{
          display: 'grid',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div>
          <label className="info-card__label" style={{ display: 'block', marginBottom: 6 }}>
            Item Value
          </label>
          <input
            type="number"
            name="itemValue"
            value={form.itemValue}
            onChange={handleChange}
            placeholder="Enter item value"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="info-card__label" style={{ display: 'block', marginBottom: 6 }}>
            Downpayment
          </label>
          <input
            type="number"
            name="downPayment"
            value={form.downPayment}
            onChange={handleChange}
            placeholder="Enter downpayment"
            style={inputStyle}
          />
          {minDownPayment > 0 && (
            <p className="muted-text" style={{ marginTop: 6 }}>
              Minimum downpayment: {formatMoney(minDownPayment)}
            </p>
          )}
        </div>

        <div>
          <label className="info-card__label" style={{ display: 'block', marginBottom: 8 }}>
            Device Type
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => handleDeviceTypeChange('ANDROID')}
              style={{
                ...toggleButtonStyle,
                ...(form.deviceType === 'ANDROID' ? activeToggleStyle : {}),
              }}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => handleDeviceTypeChange('IOS')}
              style={{
                ...toggleButtonStyle,
                ...(form.deviceType === 'IOS' ? activeToggleStyle : {}),
              }}
            >
              iOS
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 12,
              background: '#fafafa',
            }}
          >
            <div className="info-card__label">Disbursal Amount</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>
              {formatMoney(disbursementAmount)}
            </div>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 12,
              background: '#fafafa',
            }}
          >
            <div className="info-card__label">Plans Available</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>
              {hasCalculated ? emiOptions.length : 0}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={handleCalculate} style={primaryButtonStyle}>
            Calculate EMI
          </button>
          <button type="button" onClick={handleReset} style={secondaryButtonStyle}>
            Reset
          </button>
        </div>
      </div>

      {hasCalculated && (
        <div style={{ display: 'grid', gap: 12 }}>
          {emiOptions.length === 0 ? (
            <div className="info-card">
              <span className="info-card__label">No plans found</span>
              <p className="muted-text" style={{ marginTop: 6 }}>
                Check item value and downpayment, then try again.
              </p>
            </div>
          ) : (
            emiOptions.map((opt) => (
              <div
                key={opt.key}
                className="info-card"
                style={{
                  border: '1px solid #dbe2ea',
                  borderRadius: 16,
                  padding: 16,
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>
                      {opt.label} • {opt.months} month{opt.months > 1 ? 's' : ''}
                    </div>
                    <div className="muted-text" style={{ marginTop: 4 }}>
                      First EMI Date: {opt.firstEmiDate}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: '#eef4ff',
                      color: '#1a73e8',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {formatMoney(opt.emi)}/mo
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  <InfoMini label="Disbursal Amount" value={formatMoney(opt.netDisbursement)} />
                  <InfoMini label="Loan Amount" value={formatMoney(opt.loanAmount)} />
                  <InfoMini label="Total Repay" value={formatMoney(opt.totalRepay)} />
                  <InfoMini label="Last EMI Date" value={opt.lastRepaymentDate} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function InfoMini({ label, value }) {
  return (
    <div
      style={{
        border: '1px solid #eef2f7',
        borderRadius: 12,
        padding: 12,
        background: '#fafafa',
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff',
};

const primaryButtonStyle = {
  background: '#1a73e8',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
  flex: 1,
};

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111827',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
  flex: 1,
};

const toggleButtonStyle = {
  flex: 1,
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '12px 14px',
  background: '#fff',
  color: '#111827',
  cursor: 'pointer',
  fontWeight: '700',
};

const activeToggleStyle = {
  background: '#111827',
  color: '#fff',
  border: '1px solid #111827',
};

export default EmiCalculatorPage;