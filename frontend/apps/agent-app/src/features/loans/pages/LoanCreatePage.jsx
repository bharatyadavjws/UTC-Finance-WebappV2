import React, { useEffect, useMemo, useState, useRef } from 'react'; // Add useRef
import { useLocation, useNavigate } from 'react-router-dom';
import { usePDF } from 'react-to-pdf'; // Add this import
import { authService } from '../../../services/authService';

/* ---------- Responsive hook ---------- */
function useViewport() {
  const getWidth = () => window.innerWidth;
  const [width, setWidth] = useState(getWidth());

  useEffect(() => {
    const handleResize = () => setWidth(getWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
  };
}

/* ---------- EMI + eligibility helpers ---------- */
const TENURE_OPTIONS = [
  { key: 'RAPID', label: 'Rapid', months: 1 },
  { key: 'E3',    label: 'E3',    months: 3 },
  { key: 'E6',    label: 'E6',    months: 6 },
  { key: 'E9',    label: 'E9',    months: 9 },
  { key: 'E12',   label: 'E12',   months: 12 },
];

function getAllowedTenuresByDisbursement(disbursementAmount) {
  const d = Number(disbursementAmount || 0);
  if (d <= 0)     return [];
  if (d <= 5000)  return ['RAPID', 'E3'];
  if (d <= 10000) return ['RAPID', 'E3', 'E6'];
  if (d <= 30000) return ['RAPID', 'E3', 'E6', 'E9'];
  return ['RAPID', 'E3', 'E6', 'E9', 'E12'];
}

function diffInDays(startDate, endDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end   = new Date(endDate.getFullYear(),   endDate.getMonth(),   endDate.getDate());
  return Math.max(0, Math.round((end - start) / msPerDay));
}

function getNextEmiDate(baseDate) {
  const d   = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const day = d.getDate();
  let targetMonth = d.getMonth() + 1;
  let targetDay;
  if (day <= 10)      targetDay = 10;
  else if (day <= 20) targetDay = 20;
  else { targetDay = 1; targetMonth += 1; }
  return new Date(d.getFullYear(), targetMonth, targetDay);
}

export function calculateEmiOptions(itemValue, downPayment, deviceType = 'ANDROID', isExistingUser = false) {
  const item              = Number(itemValue  || 0);
  const down              = Number(downPayment || 0);
  const disbursementAmount = Math.max(item - down, 0);
  if (disbursementAmount <= 0) return [];

  const AV_FEE   = 200;
  const LOCK_FEE = deviceType === 'IOS' ? 400 : 150;
  const gross       = disbursementAmount + AV_FEE + LOCK_FEE;
  const loanAmount  = Math.ceil((gross * 100) / 90);
  const pfRate      = isExistingUser ? 0.08 : 0.1;
  const processingFee = Math.round(loanAmount * pfRate);

  const allowedKeys = getAllowedTenuresByDisbursement(disbursementAmount);
  if (allowedKeys.length === 0) return [];

  const today          = new Date();
  const filteredTenures = TENURE_OPTIONS.filter((t) => allowedKeys.includes(t.key));
  const dailyRate      = 0.00065753424658;

  return filteredTenures.map((t) => {
    const months   = t.months;
    const schedule = [];
    let emiDate    = getNextEmiDate(today);

    for (let i = 0; i < months; i++) {
      schedule.push(new Date(emiDate));
      emiDate = new Date(emiDate.getFullYear(), emiDate.getMonth() + 1, emiDate.getDate());
    }

    const firstDate         = schedule[0];
    const lastDate          = schedule[schedule.length - 1];
    const days              = diffInDays(today, lastDate);
    const interest          = loanAmount * dailyRate * days;
    const totalRepay        = loanAmount + interest;
    const emi               = Math.ceil(totalRepay / months);
    const firstEmiDate      = firstDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const lastRepaymentDate = lastDate.toLocaleDateString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric' });

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
      firstEmiDate,
      lastRepaymentDate,
      avFee: AV_FEE,
      appLockFee: LOCK_FEE,
      totalCharges: processingFee,
      actualProcessingFee: processingFee - AV_FEE - LOCK_FEE,
    };
  });
}

export function computeApprovedCreditLimit({ itemValue, downPayment, income, cibil, existingEmi }) {
  const item    = Number(itemValue   || 0);
  const down    = Number(downPayment || 0);
  const inc     = Number(income      || 0);
  const cib     = Number(cibil       || 0);
  const currEmi = Number(existingEmi || 0);

  if (!item || item <= 0)       return { ok: false, error: 'Enter a valid Item Value.' };
  if (!down || down <= 0)       return { ok: false, error: 'Enter a valid downpayment.' };
  if (down > item)              return { ok: false, error: 'Downpayment cannot be more than Item Value.' };
  if (!inc || inc < 10000)      return { ok: false, error: 'Enter a valid monthly income (min 10,000).' };
  if (cib && (cib < 300 || cib > 900) && cib !== 0) {
    return { ok: false, error: 'Enter a valid CIBIL score (300–900) or 0.' };
  }

  const dpPct = (down / item) * 100;
  let requiredMinPct = 0;
  if (item >= 10000 && item <= 20000)      requiredMinPct = 30;
  else if (item >= 20001 && item <= 35000) requiredMinPct = 30;
  else if (item >= 35001 && item <= 50000) requiredMinPct = 25;
  else if (item >= 50001)                  requiredMinPct = 20;

  if (!requiredMinPct) return { ok: false, error: 'Item value is outside the allowed range for this product.' };
  if (dpPct < requiredMinPct) return { ok: false, error: `Minimum downpayment for this item value is ${requiredMinPct}% of item value.` };

  let creditLimit = Math.min(Math.max(item - down, 0), 35000);

  let cibilCap = 0;
  if (cib === 0)       cibilCap = 15000;
  else if (cib >= 750) cibilCap = 35000;
  else if (cib >= 725) cibilCap = 33000;
  else if (cib >= 700) cibilCap = 30000;
  else if (cib >= 675) cibilCap = 26000;
  else if (cib >= 650) cibilCap = 21000;
  else cibilCap = 0;

  if (!cibilCap) return { ok: false, error: 'Customer not eligible as per CIBIL band.' };

  creditLimit = Math.min(creditLimit, cibilCap);
  if (cib === 0) creditLimit = 15000;

  const foirCurrent = inc > 0 ? (currEmi / inc) * 100 : 0;
  let maxFoir = 0;
  if (inc >= 10000 && inc <= 20000)      maxFoir = 50;
  else if (inc >= 20001 && inc <= 30000) maxFoir = 55;
  else if (inc >= 30001 && inc <= 50000) maxFoir = 60;
  else if (inc >= 50001 && inc <= 75000) maxFoir = 70;
  else if (inc > 75000)                  maxFoir = 75;

  if (!maxFoir)              return { ok: false, error: 'No FOIR rule found for this income band.' };
  if (foirCurrent > maxFoir) return { ok: false, error: `FOIR exceeds the maximum allowed ${maxFoir}% for this income band.` };
  if (!creditLimit)          return { ok: false, error: 'No credit limit available for this combination.' };

  return { ok: true, creditLimit };
}

/* ---------- EMI Schedule builder ---------- */
function buildEmiSchedule(selectedPlan) {
  if (!selectedPlan) return [];

  const loanDate   = new Date();
  const months     = selectedPlan.months;
  const emiBase    = Math.round(selectedPlan.emi);
  const totalRepay = Math.round(selectedPlan.totalRepay);

  const loanDay = loanDate.getDate();
  let emiDay;
  if (loanDay <= 1)       emiDay = 1;
  else if (loanDay <= 10) emiDay = 10;
  else if (loanDay <= 20) emiDay = 20;
  else                    emiDay = 1;

  const firstEmiDate = new Date(loanDate);
  firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
  firstEmiDate.setDate(emiDay);
  if (loanDay > 20 && emiDay === 1) {
    firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
  }

  const sumIfAllEqual  = emiBase * months;
  const diff           = totalRepay - sumIfAllEqual;
  let remainingBalance = totalRepay;
  const schedule       = [];

  for (let i = 0; i < months; i++) {
    const emiDate = new Date(firstEmiDate);
    emiDate.setMonth(firstEmiDate.getMonth() + i);

    let emiAmount = emiBase;
    if (i === months - 1) emiAmount = emiBase + diff;

    remainingBalance = Math.max(0, remainingBalance - emiAmount);

    schedule.push({
      emiNumber:        i + 1,
      dueDate:          emiDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount:           emiAmount,
      remainingBalance: remainingBalance.toFixed(2),
    });
  }

  return schedule;
}

/* ---------- Helper: Convert File to base64 for PDF ---------- */
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!file) resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  function SuccessScreen({ loanCode, retailer, form, selectedPlan, isMobile, onClose }) {
    const { toPDF, targetRef } = usePDF({ 
      filename: `UTC_KFS_${form.customerName}_${loanCode}.pdf`,
    });
  
    const [customerPhotoURL, setCustomerPhotoURL] = useState(null);
  
    // UTC Finance Constants
    const COMPANY_NAME = "UTC FINANCE PVT. LTD.";
    const ADDRESS = "Plot 47, Sagar Enclave, Rajendra Park, Gurgaon, Haryana-122001";
    const EMAIL = "hello@utcfinance.com";
    const CIN = "U65910HR2024PTC042961";
  
    useEffect(() => {
      if (form.customerPhoto) {
        fileToDataURL(form.customerPhoto).then(setCustomerPhotoURL);
      }
    }, [form.customerPhoto]);
  
    const itemValue = Number(form.itemValue || 0);
    const disbursement = selectedPlan?.netDisbursement ?? 0;
    const loanAmount = selectedPlan?.loanAmount ?? 0;
    const emiAmount = selectedPlan?.emi ?? 0;
    const tenure = selectedPlan?.months ?? 0;
    const totalRepay = Math.round(selectedPlan?.totalRepay ?? 0);
    const emiSchedule = buildEmiSchedule(selectedPlan);
  
    const inr = (val) => `${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
    // PDF Internal Styles
    const pdfPage = { width: '794px', minHeight: '1120px', padding: '30px 40px', background: '#fff', color: '#000', fontFamily: 'serif', boxSizing: 'border-box', pageBreakAfter: 'always', fontSize: '9px', lineHeight: '1.2' };
    const kfsTable = { width: '100%', borderCollapse: 'collapse', marginTop: '5px', marginBottom: '10px' };
    const kfsTd = { border: '1px solid #000', padding: '4px 6px', verticalAlign: 'top' };
    const kfsTh = { ...kfsTd, background: '#f2f2f2', fontWeight: 'bold' };
  
    return (
      <div>
        {/* UI SUCCESS BANNER */}
        <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '12px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#1b5e20' }}>Loan Approved</div>
          <div style={{ fontSize: '14px', color: '#2e7d32', marginTop: '4px' }}>Agreement ID: <strong>{loanCode}</strong></div>
        </div>
  
        <button
          onClick={() => toPDF()}
          style={{ ...primaryButtonStyle, width: '100%', background: '#0f9d58', marginBottom: '12px', height: '50px' }}
        >
          Download Sanction Letter / KFS
        </button>
  
        {/* HIDDEN PDF CONTENT (BAJAJ STYLE) */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div ref={targetRef}>
            
            {/* PAGE 1: COVER & INTRO */}
            <div style={pdfPage}>
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{COMPANY_NAME}</h1>
                    <div style={{ fontSize: '8px', marginTop: '4px' }}>
                      <strong>Corporate Office:</strong> {ADDRESS}<br/>
                      <strong>Registered Office:</strong> {ADDRESS}<br/>
                      <strong>CIN:</strong> {CIN} | <strong>Email:</strong> {EMAIL}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>Key Fact Statement</div>
                </div>
              </div>
  
              <div style={{ marginTop: '20px' }}>
                <div><strong>Sub: Key Fact Statement / विषय: मुख्य तथ्य विवरण</strong></div>
                <p style={{ marginTop: '15px' }}>
                  Dear <strong>{form.customerName}</strong>,<br/><br/>
                  We thank you for choosing <strong>{COMPANY_NAME}</strong> as your financial partner. In reference to your loan request to purchase consumer durable products, we have approved your loan request. 
                  As you embark on this journey with us, our priority is to ensure that you are well-informed about the interest rates, fees and Annual Percentage Rate (APR) associated with this loan.
                </p>
                <div style={{ marginTop: '40px', borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
                  Authorised Signatory<br/>{COMPANY_NAME}
                </div>
              </div>
  
              <div style={{ marginTop: '50px', border: '1px solid #000', padding: '10px' }}>
                <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
                  ANNEXURE A: KEY FACT STATEMENT - CONSUMER LOAN
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <table style={{ width: '100%', fontSize: '10px' }}>
                    <tbody>
                      <tr><td>Date:</td><td><strong>{new Date().toLocaleDateString('en-IN')}</strong></td></tr>
                      <tr><td>Reference No:</td><td><strong>{loanCode}</strong></td></tr>
                      <tr><td>Customer Name:</td><td><strong>{form.customerName}</strong></td></tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', fontSize: '10px' }}>
                    <tbody>
                      <tr><td>Dealer Name:</td><td><strong>{retailer?.shop_name}</strong></td></tr>
                      <tr><td>Dealer Code:</td><td><strong>{retailer?.id}</strong></td></tr>
                      <tr><td>Mobile:</td><td><strong>{form.customerPhone}</strong></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
  
            {/* PAGE 2: PART 1 DATA TABLE */}
            <div style={pdfPage}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Part 1: Interest rate and fees/charges</div>
              <table style={kfsTable}>
                <thead>
                  <tr>
                    <th style={kfsTh}>Sr No.</th>
                    <th style={kfsTh}>Parameter / पैरामीटर</th>
                    <th style={kfsTh}>Details / विवरण</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={kfsTd}>1</td><td style={kfsTd}>Loan Proposal Account No.</td><td style={kfsTd}>{loanCode}</td></tr>
                  <tr><td style={kfsTd}>2</td><td style={kfsTd}>Type of Loan</td><td style={kfsTd}>Consumer Loan</td></tr>
                  <tr><td style={kfsTd}>3</td><td style={kfsTd}>Gross Loan Amount</td><td style={kfsTd}>{inr(loanAmount)}</td></tr>
                  <tr><td style={kfsTd}>4</td><td style={kfsTd}>Advance EMI collected</td><td style={kfsTd}>0.00</td></tr>
                  <tr><td style={kfsTd}>5</td><td style={kfsTd}>Loan Amount (To be disbursed to dealer)</td><td style={kfsTd}>{inr(disbursement)}</td></tr>
                  <tr><td style={kfsTd}>6</td><td style={kfsTd}>Disbursal Schedule</td><td style={kfsTd}>100% Upfront</td></tr>
                  <tr><td style={kfsTd}>7</td><td style={kfsTd}>Loan Term (Net Tenure)</td><td style={kfsTd}>{tenure} Months</td></tr>
                  <tr><td style={kfsTd}>8</td><td style={kfsTd}>Monthly EMI Amount</td><td style={kfsTd}>{inr(emiAmount)}</td></tr>
                  <tr><td style={kfsTd}>9</td><td style={kfsTd}>Rate of Interest per annum</td><td style={kfsTd}>24.00% (Reducing)</td></tr>
                  <tr><td style={kfsTd}>10</td><td style={kfsTd}>Interest Type</td><td style={kfsTd}>Fixed</td></tr>
                  <tr><td style={kfsTd}>11</td><td style={kfsTd}>Processing Fees (One-time)</td><td style={kfsTd}>{inr(selectedPlan?.processingFee)}</td></tr>
                  <tr><td style={kfsTd}>12</td><td style={kfsTd}>Annual Percentage Rate (APR)</td><td style={kfsTd}>24.12%</td></tr>
                </tbody>
              </table>
            </div>
  
            {/* PAGE 3: REPAYMENT SCHEDULE */}
            <div style={pdfPage}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ANNEXURE C: REPAYMENT SCHEDULE</div>
              <table style={{ ...kfsTable, textAlign: 'center', fontSize: '8px' }}>
                <thead>
                  <tr>
                    <th style={kfsTh}>Instl No.</th>
                    <th style={kfsTh}>Due Date</th>
                    <th style={kfsTh}>Instl Amt (EMI)</th>
                    <th style={kfsTh}>Principal</th>
                    <th style={kfsTh}>Interest</th>
                    <th style={kfsTh}>Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {emiSchedule.map(row => (
                    <tr key={row.emiNumber}>
                      <td style={kfsTd}>{row.emiNumber}</td>
                      <td style={kfsTd}>{row.dueDate}</td>
                      <td style={kfsTd}>{inr(row.amount)}</td>
                      <td style={kfsTd}>{inr(row.amount * 0.82)}</td>
                      <td style={kfsTd}>{inr(row.amount * 0.18)}</td>
                      <td style={kfsTd}>{inr(row.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
  
          </div>
        </div>
  
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', background: '#fff' }}>
           <div style={{ fontWeight: 'bold' }}>Quick Review</div>
           <div style={{ fontSize: '14px', marginTop: '5px' }}>
              {form.customerName} | {form.itemName} <br/>
              EMI: {inr(selectedPlan?.emi)} / month
           </div>
        </div>
  
        <button type="button" onClick={onClose} style={{ ...secondaryButtonStyle, width: '100%', marginTop: '10px' }}>
          Back to Loans List
        </button>
      </div>
    );
  }
  
  

/* ---------- UI helpers ---------- */
function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{value || '-'}</div>
    </div>
  );
}

const fieldGroupStyle = { display: 'grid', gap: '6px' };

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
};

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
};

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111827',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '12px 16px',
  cursor: 'pointer',
  fontWeight: '700',
};

function twoColGridStyle(isMobile) {
  return {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '12px',
  };
}

/* ---------- Main multi-step page ---------- */
const TOTAL_STEPS = 5;

export default function LoanCreatePage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isMobile, isTablet } = useViewport();

  const retailer = location.state?.retailer || null;

  const [step,          setStep]          = useState(1);
  const [error,         setError]         = useState('');
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isConfirmed,   setIsConfirmed]   = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState(null);
  const [selectedPlan,  setSelectedPlan]  = useState(null);
  const [emiOptions,    setEmiOptions]    = useState([]);

  const [form, setForm] = useState({
    // Step 1
    customerName:          '',
    customerPhone:         '',
    customerEmail:         '',
    customerDob:           '',
    customerMonthlySalary: '',
    customerAddress:       '',
    customerPhoto:         null,
    // Step 2
    aadharNumber: '',
    aadharFront:  null,
    aadharBack:   null,
    panNumber:    '',
    panPhoto:     null,
    accountNumber: '',
    ifscCode:      '',
    // Step 3
    itemName:  '',
    itemValue: '',
    itemImei:  '',
    itemPhoto: null,
    // Step 4
    downPayment: '',
    cibilScore:  '',
    currentEmi:  '',
    deviceType:  'ANDROID',
  });

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let newValue = value;
      if (name === 'aadharNumber') newValue = value.replace(/\D/g, '').slice(0, 12);
      if (name === 'panNumber')    newValue = value.toUpperCase();
      if (name === 'ifscCode')     newValue = value.toUpperCase();
      if (name === 'cibilScore')   newValue = value.replace(/\D/g, '').slice(0, 3);

      const next = { ...prev, [name]: newValue };

      if (name === 'itemValue') {
        const num = Number(newValue || 0);
        let autoDp = 0;
        if (num >= 10000 && num <= 20000)      autoDp = Math.ceil(num * 0.3);
        else if (num >= 20001 && num <= 35000) autoDp = Math.ceil(num * 0.3);
        else if (num >= 35001 && num <= 50000) autoDp = Math.ceil(num * 0.25);
        else if (num >= 50001)                 autoDp = Math.ceil(num * 0.2);
        if (autoDp) next.downPayment = String(autoDp);
      }

      return next;
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;
    setForm((prev) => ({ ...prev, [name]: file }));
  };

  const handleDeviceTypeChange = (type) => {
    setForm((prev) => ({ ...prev, deviceType: type }));
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  /* ---------- Validations ---------- */
  const validateStep1 = () => {
    if (!form.customerName.trim())    return 'Customer name is required.';
    if (!form.customerPhone.trim())   return 'Phone number is required.';
    if (!form.customerDob)            return 'Date of birth is required.';
    if (!form.customerMonthlySalary)  return 'Monthly salary is required.';
    if (!form.customerAddress.trim()) return 'Address is required.';

    const today = new Date();
    const dob   = new Date(form.customerDob);
    if (Number.isNaN(dob.getTime())) return 'Enter a valid date of birth.';

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
    if (age < 21 || age > 50) return 'Customer age must be between 21 and 50 years.';
    return '';
  };

  const validateStep2 = () => {
    if (!form.aadharNumber.trim())               return 'Aadhaar number is required.';
    if (!/^\d{12}$/.test(form.aadharNumber))     return 'Aadhaar number must be exactly 12 digits.';
    if (!form.panNumber.trim())                  return 'PAN number is required.';
    if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(form.panNumber)) return 'Enter a valid PAN (5 letters, 4 digits, 1 letter, all caps).';
    if (!form.accountNumber.trim())              return 'Account number is required.';
    if (!form.ifscCode.trim())                   return 'IFSC code is required.';
    return '';
  };

  const validateStep3 = () => {
    if (!form.itemName.trim())          return 'Item name is required.';
    if (!Number(form.itemValue || 0))   return 'Item value must be greater than 0.';
    return '';
  };

  const validateStep4 = () => {
    const eligibility = computeApprovedCreditLimit({
      itemValue:   form.itemValue,
      downPayment: form.downPayment,
      income:      form.customerMonthlySalary,
      cibil:       form.cibilScore,
      existingEmi: form.currentEmi,
    });
    if (!eligibility.ok)    return eligibility.error;
    if (!form.cibilScore)   return 'CIBIL score is required.';
    if (!selectedPlan)      return 'Select an EMI plan to continue.';
    return '';
  };

  const handleNext = () => {
    if (createdLoanId) return;
    let msg = '';
    if (step === 1) msg = validateStep1();
    if (step === 2) msg = validateStep2();
    if (step === 3) msg = validateStep3();
    if (step === 4) msg = validateStep4();
    if (msg) { setError(msg); return; }
    setError('');
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const handleBack = () => {
    if (createdLoanId) return;
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  /* ---------- EMI options for step 4 ---------- */
  const itemValueNum  = Number(form.itemValue  || 0);
  const downPaymentNum = Number(form.downPayment || 0);

  const eligibilityForEmi =
    step === 4 && itemValueNum > 0 && downPaymentNum > 0
      ? computeApprovedCreditLimit({
          itemValue:   form.itemValue,
          downPayment: form.downPayment,
          income:      form.customerMonthlySalary,
          cibil:       form.cibilScore,
          existingEmi: form.currentEmi,
        })
      : { ok: false };

  useEffect(() => {
    if (step !== 4) return;

    if (!(itemValueNum > 0 && downPaymentNum > 0 && eligibilityForEmi.ok)) {
      setEmiOptions([]);
      setSelectedPlan(null);
      return;
    }

    const creditLimit        = eligibilityForEmi.creditLimit;
    const item               = itemValueNum;
    const effectiveDownPayment = Math.max(item - creditLimit, 0);

    const opts = calculateEmiOptions(
      item,
      effectiveDownPayment,
      form.deviceType,
      false,
    );

    if (!opts || opts.length === 0) {
      setEmiOptions([]);
      setSelectedPlan(null);
      return;
    }

    const finalOpts = opts.map((opt) => ({
      ...opt,
      netDisbursement: creditLimit,
    }));

    setEmiOptions(finalOpts);
    setSelectedPlan(null);
  }, [step, itemValueNum, downPaymentNum, eligibilityForEmi.ok, eligibilityForEmi.creditLimit, form.deviceType]);

  /* ---------- Create loan ---------- */
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (createdLoanId) return;

    const step4Error = validateStep4();
    if (step4Error) { setError(step4Error); return; }
    if (!isConfirmed) { setError('You must accept the loan terms to create the loan.'); return; }

    try {
      setIsSubmitting(true);
      setError('');

      const fd = new FormData();

      // Retailer
      fd.append('retailer_code', retailer?.id || '');

      // Customer
      fd.append('customer_name',           form.customerName           || '');
      fd.append('customer_phone',          form.customerPhone          || '');
      fd.append('customer_email',          form.customerEmail          || '');
      fd.append('customer_dob',            form.customerDob            || '');
      fd.append('customer_monthly_salary', form.customerMonthlySalary  || '');
      fd.append('customer_address',        form.customerAddress        || '');
      if (form.customerPhoto) fd.append('customer_photo', form.customerPhoto);

      // KYC
      fd.append('aadhar_number',  form.aadharNumber  || '');
      fd.append('pan_number',     form.panNumber     || '');
      fd.append('account_number', form.accountNumber || '');
      fd.append('ifsc_code',      form.ifscCode      || '');
      if (form.aadharFront) fd.append('aadhar_front', form.aadharFront);
      if (form.aadharBack)  fd.append('aadhar_back',  form.aadharBack);
      if (form.panPhoto)    fd.append('pan_photo',    form.panPhoto);

      // Device
      fd.append('item_name',    form.itemName    || '');
      fd.append('item_value',   form.itemValue   || '');
      fd.append('item_imei',    form.itemImei    || '');
      fd.append('device_type',  form.deviceType  || 'ANDROID');
      fd.append('down_payment', form.downPayment || '');
      fd.append('cibil_score',  form.cibilScore  || '');
      fd.append('current_emi',  form.currentEmi  || '');
      if (form.itemPhoto) fd.append('item_photo', form.itemPhoto);

      // Selected EMI plan
      if (selectedPlan) {
        fd.append('plan_key',            selectedPlan.key               || '');
        fd.append('plan_label',          selectedPlan.label             || '');
        fd.append('plan_months',         selectedPlan.months            || '');
        fd.append('loan_amount',         selectedPlan.loanAmount        || '');
        fd.append('net_disbursement',    selectedPlan.netDisbursement   || '');
        fd.append('emi_amount',          selectedPlan.emi               || '');
        fd.append('processing_fee',      selectedPlan.processingFee     || '');
        fd.append('total_repay',         selectedPlan.totalRepay        || '');
        fd.append('interest_amount',     selectedPlan.interest          || '');
        fd.append('av_fee',              selectedPlan.avFee             || '');
        fd.append('app_lock_fee',        selectedPlan.appLockFee        || '');
        fd.append('total_charges',       selectedPlan.totalCharges      || '');
        fd.append('first_emi_date',      selectedPlan.firstEmiDate      || '');
        fd.append('last_repayment_date', selectedPlan.lastRepaymentDate || '');
        fd.append('tenure_days',         selectedPlan.days              || '');
      }

      const token = authService.getToken();

        const response = await fetch('http://127.0.0.1:8000/api/loans', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            // DO NOT set Content-Type — browser sets multipart/form-data boundary automatically
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
        });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || `Request failed with status ${response.status}`);
      }

      setCreatedLoanId(json.data.loan_code);

    } catch (err) {
      console.error('Create loan error:', err);
      setError(err.message || 'Unable to create loan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Layout ---------- */
  const pagePadding    = isMobile ? '88px 16px 110px' : isTablet ? '96px 20px 110px' : '110px 32px 120px';
  const gridColumns    = isMobile ? '1fr' : 'minmax(0, 1.2fr) 340px';
  const summaryColumns = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div style={{ padding: pagePadding, background: '#f5f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '32px' : '42px', lineHeight: 1.1, marginBottom: '8px', color: '#111827', fontWeight: '800' }}>
              Create Loan
            </h1>
            <p style={{ color: '#6b7280', fontSize: isMobile ? '14px' : '15px' }}>
              Multi-step journey with KYC, device, EMI selection, and preview.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/retailers')} style={secondaryButtonStyle}>
            Back to Retailers
          </button>
        </div>

        {/* No retailer warning */}
        {!retailer && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '14px', borderRadius: '10px', border: '1px solid #ffe08a', marginBottom: '16px' }}>
            No retailer selected. Please go back and start a loan from a retailer card.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ background: '#fdecea', color: '#b71c1c', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #f5c2c7' }}>
            {error}
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '24px', alignItems: 'start' }}>

          {/* Left: wizard */}
          <div style={{ border: '1px solid #dbe2ea', borderRadius: '16px', padding: isMobile ? '16px' : '20px', background: '#ffffff' }}>

            {/* Retailer summary */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb', padding: '16px', marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Selected Retailer</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
                {retailer?.shop_name || 'Not selected'}
              </div>
              <div style={{ color: '#374151', marginBottom: '12px' }}>{retailer?.owner_name || '-'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: summaryColumns, gap: '12px' }}>
                <InfoRow label="Retailer Code" value={retailer?.id} />
                <InfoRow label="Mobile"        value={retailer?.mobile} />
                <InfoRow label="City"          value={retailer?.city} />
                <InfoRow label="State"         value={retailer?.state} />
              </div>
            </div>

            {/* Progress bar */}
            {!createdLoanId && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', background: '#1a73e8', transition: 'width 180ms ease-out' }} />
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563' }}>Step {step} of {TOTAL_STEPS}</div>
              </div>
            )}

            {/* Step body */}
            <form onSubmit={handleCreateLoan} style={{ display: 'grid', gap: '16px' }}>
              {step === 1 && (
                <StepCustomerDetails
                  form={form}
                  onTextChange={handleTextChange}
                  onFileChange={handleFileChange}
                  isMobile={isMobile}
                />
              )}
              {step === 2 && (
                <StepKycDetails
                  form={form}
                  onTextChange={handleTextChange}
                  onFileChange={handleFileChange}
                  isMobile={isMobile}
                />
              )}
              {step === 3 && (
                <StepItemDetails
                  form={form}
                  onTextChange={handleTextChange}
                  onFileChange={handleFileChange}
                  isMobile={isMobile}
                />
              )}
              {step === 4 && (
                <StepDownpaymentEmi
                  form={form}
                  onTextChange={handleTextChange}
                  emiOptions={emiOptions}
                  selectedPlan={selectedPlan}
                  setSelectedPlan={setSelectedPlan}
                  onDeviceTypeChange={handleDeviceTypeChange}
                  eligibility={eligibilityForEmi}
                  isMobile={isMobile}
                />
              )}
              {step === 5 && (
                <StepPreview
                  retailer={retailer}
                  form={form}
                  selectedPlan={selectedPlan}
                  isConfirmed={isConfirmed}
                  setIsConfirmed={setIsConfirmed}
                />
              )}

              {/* Footer buttons — hide after loan created */}
              {!createdLoanId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button
                    type="button"
                    onClick={step === 1 ? () => navigate('/loans') : handleBack}
                    style={{ ...secondaryButtonStyle, width: isMobile ? '100%' : 'auto' }}
                    disabled={isSubmitting}
                  >
                    {step === 1 ? 'Close' : 'Back'}
                  </button>

                  {step < TOTAL_STEPS && (
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{ ...primaryButtonStyle, width: isMobile ? '100%' : 'auto' }}
                      disabled={isSubmitting}
                    >
                      Next
                    </button>
                  )}

                  {step === TOTAL_STEPS && (
                    <button
                      type="submit"
                      style={{ ...primaryButtonStyle, width: isMobile ? '100%' : 'auto' }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Loan'}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right column: EMI Snapshot or Success Screen */}
          <div
            style={{
              border: '1px solid #dbe2ea',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '20px',
              background: '#ffffff',
              position: isMobile ? 'static' : 'sticky',
              top: isMobile ? 'auto' : '96px',
            }}
          >
            {createdLoanId ? (
              <SuccessScreen
                loanCode={createdLoanId}
                retailer={retailer}
                form={form}
                selectedPlan={selectedPlan}
                isMobile={isMobile}
                onClose={() => navigate('/loans')}
                />
                ) : selectedPlan ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <h2 style={{ fontSize: isMobile ? '24px' : '28px', marginBottom: '4px', color: '#111827' }}>
                      EMI Snapshot
                    </h2>
    
                    <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Selected Plan</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                        {selectedPlan.label} • {selectedPlan.months} month{selectedPlan.months > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        First EMI: <strong>{selectedPlan.firstEmiDate}</strong>
                        {', '}Last EMI: <strong>{selectedPlan.lastRepaymentDate}</strong>
                      </div>
                    </div>
    
                    <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fafafa' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Loan Summary</div>
                      {[
                        ['Loan Amount',      `₹ ${selectedPlan.loanAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                        ['Monthly EMI',      `₹ ${selectedPlan.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                        ['Net Disbursement', `₹ ${selectedPlan.netDisbursement.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                        ['Total Repay',      `₹ ${selectedPlan.totalRepay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
                      ].map(([label, value]) => (
                        <div key={label} style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                          {label}: <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ fontSize: isMobile ? '24px' : '28px', marginBottom: '16px', color: '#111827' }}>
                      EMI Snapshot
                    </h2>
                    <div
                      style={{
                        padding: '24px',
                        borderRadius: '12px',
                        background: '#f9fafb',
                        border: '1px dashed #d1d5db',
                        color: '#6b7280',
                        textAlign: 'center',
                      }}
                    >
                      Select an EMI plan in Step 4 to see full loan summary.
                    </div>
                  </div>
                )}
              </div>
    
            </div>
          </div>
        </div>
      );
    }
    
    /* ---------- Step 1: Customer Details ---------- */
    function StepCustomerDetails({ form, onTextChange, onFileChange, isMobile }) {
      return (
        <section>
          <h3 style={{ fontSize: isMobile ? '20px' : '22px', marginBottom: '10px', color: '#111827' }}>
            Customer Details
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Customer Name</label>
              <input type="text" name="customerName" style={inputStyle} placeholder="Enter full name" value={form.customerName} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Mobile Number</label>
              <input type="tel" name="customerPhone" style={inputStyle} placeholder="10-digit mobile number" value={form.customerPhone} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Email (optional)</label>
              <input type="email" name="customerEmail" style={inputStyle} placeholder="name@example.com" value={form.customerEmail} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" name="customerDob" style={inputStyle} value={form.customerDob} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Monthly Salary</label>
              <input type="number" name="customerMonthlySalary" style={inputStyle} placeholder="Net monthly income" value={form.customerMonthlySalary} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Current Address</label>
              <textarea name="customerAddress" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="House / Street / City / Pincode" value={form.customerAddress} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Customer Photo (optional)</label>
              <input type="file" name="customerPhoto" accept="image/*" style={inputStyle} onChange={onFileChange} />
            </div>
          </div>
        </section>
      );
    }
    
    /* ---------- Step 2: KYC Details ---------- */
    function StepKycDetails({ form, onTextChange, onFileChange, isMobile }) {
      return (
        <section>
          <h3 style={{ fontSize: isMobile ? '20px' : '22px', marginBottom: '10px', color: '#111827' }}>
            KYC Details
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Aadhaar Number</label>
              <input type="text" name="aadharNumber" style={inputStyle} placeholder="12-digit Aadhaar number" value={form.aadharNumber} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Aadhaar Front Photo</label>
              <input type="file" name="aadharFront" accept="image/*" style={inputStyle} onChange={onFileChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Aadhaar Back Photo</label>
              <input type="file" name="aadharBack" accept="image/*" style={inputStyle} onChange={onFileChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>PAN Number</label>
              <input type="text" name="panNumber" style={inputStyle} placeholder="ABCDE1234F" value={form.panNumber} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>PAN Photo</label>
              <input type="file" name="panPhoto" accept="image/*" style={inputStyle} onChange={onFileChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Account Number</label>
              <input type="text" name="accountNumber" style={inputStyle} placeholder="Customer bank account number" value={form.accountNumber} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>IFSC Code</label>
              <input type="text" name="ifscCode" style={inputStyle} placeholder="Bank IFSC code" value={form.ifscCode} onChange={onTextChange} />
            </div>
          </div>
        </section>
      );
    }
    
    /* ---------- Step 3: Item Details ---------- */
    function StepItemDetails({ form, onTextChange, onFileChange, isMobile }) {
      return (
        <section>
          <h3 style={{ fontSize: isMobile ? '20px' : '22px', marginBottom: '10px', color: '#111827' }}>
            Device Details
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Device Name / Model</label>
              <input type="text" name="itemName" style={inputStyle} placeholder="e.g., iPhone 15, Samsung S24" value={form.itemName} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Item Value</label>
              <input type="number" name="itemValue" style={inputStyle} placeholder="Total device price" value={form.itemValue} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>IMEI Number (optional)</label>
              <input type="text" name="itemImei" style={inputStyle} placeholder="Device IMEI" value={form.itemImei} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Device Photo (optional)</label>
              <input type="file" name="itemPhoto" accept="image/*" style={inputStyle} onChange={onFileChange} />
            </div>
          </div>
        </section>
      );
    }
    
    /* ---------- Step 4: Downpayment + EMI ---------- */
    function StepDownpaymentEmi({ form, onTextChange, emiOptions, selectedPlan, setSelectedPlan, onDeviceTypeChange, eligibility, isMobile }) {
      const itemValueNum   = Number(form.itemValue  || 0);
      const downPaymentNum = Number(form.downPayment || 0);
    
      let minDpText = '';
      if (itemValueNum >= 10000 && itemValueNum <= 20000)      minDpText = 'Minimum downpayment for this band is 30%.';
      else if (itemValueNum >= 20001 && itemValueNum <= 35000) minDpText = 'Minimum downpayment for this band is 30%.';
      else if (itemValueNum >= 35001 && itemValueNum <= 50000) minDpText = 'Minimum downpayment for this band is 25%.';
      else if (itemValueNum >= 50001)                          minDpText = 'Minimum downpayment for this band is 20%.';
    
      return (
        <section>
          <h3 style={{ fontSize: isMobile ? '20px' : '22px', marginBottom: '10px', color: '#111827' }}>
            Downpayment & EMI
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Item Value</label>
              <input type="number" name="itemValue" style={inputStyle} placeholder="Total device price" value={form.itemValue} onChange={onTextChange} />
              {minDpText && <p style={{ fontSize: '12px', marginTop: '4px', color: '#374151' }}>{minDpText}</p>}
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Downpayment</label>
              <input type="number" name="downPayment" style={inputStyle} placeholder="Customer downpayment amount" value={form.downPayment} onChange={onTextChange} />
              {itemValueNum > 0 && downPaymentNum > 0 && (
                <p style={{ fontSize: '12px', marginTop: '4px', color: '#374151' }}>
                  Net disbursement: {(itemValueNum - downPaymentNum).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>CIBIL Score</label>
              <input type="number" name="cibilScore" style={inputStyle} placeholder="Enter CIBIL score" value={form.cibilScore} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Current EMI total</label>
              <input type="number" name="currentEmi" style={inputStyle} placeholder="All existing EMIs per month" value={form.currentEmi} onChange={onTextChange} />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Device Type</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  style={{ ...secondaryButtonStyle, background: form.deviceType === 'ANDROID' ? '#111827' : '#fff', color: form.deviceType === 'ANDROID' ? '#f9fafb' : '#111827', flex: 1 }}
                  onClick={() => onDeviceTypeChange('ANDROID')}
                >
                  Android
                </button>
                <button
                  type="button"
                  style={{ ...secondaryButtonStyle, background: form.deviceType === 'IOS' ? '#111827' : '#fff', color: form.deviceType === 'IOS' ? '#f9fafb' : '#111827', flex: 1 }}
                  onClick={() => onDeviceTypeChange('IOS')}
                >
                  iOS
                </button>
              </div>
            </div>
    
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#111827' }}>
                Available EMI Options
              </div>
    
              {!eligibility.ok || emiOptions.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Enter valid Item Value, Downpayment, income, CIBIL, and current EMI to see EMI options.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {emiOptions.map((opt) => {
                    const isActive = selectedPlan && selectedPlan.key === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedPlan(opt)}
                        style={{
                          textAlign: 'left',
                          borderRadius: '12px',
                          border: isActive ? '2px solid #1a73e8' : '1px solid #e5e7eb',
                          padding: '12px',
                          background: isActive ? '#e8f0fe' : '#fafafa',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                            {opt.label} • {opt.months} month{opt.months > 1 ? 's' : ''}
                            </div>
                      {isActive && (
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '999px', background: '#1a73e8', color: '#fff' }}>
                          Selected
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', color: '#374151' }}>
                      <div>
                        <div>Loan Amount</div>
                        <div style={{ fontWeight: '600' }}>₹{opt.loanAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div>
                        <div>Net Disbursement</div>
                        <div style={{ fontWeight: '600' }}>₹{opt.netDisbursement.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div>
                        <div>Last EMI Date</div>
                        <div style={{ fontWeight: '600' }}>{opt.lastRepaymentDate}</div>
                      </div>
                      <div>
                        <div>Monthly EMI</div>
                        <div style={{ fontWeight: '700', color: '#1a73e8' }}>₹{opt.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Step 5: Preview + Consent ---------- */
function StepPreview({ retailer, form, selectedPlan, isConfirmed, setIsConfirmed }) {
  const itemValueNum        = Number(form.itemValue  || 0);
  const downPaymentNum      = Number(form.downPayment || 0);
  const disbursementAmount  = selectedPlan?.netDisbursement ?? Math.max(itemValueNum - downPaymentNum, 0);
  const adjustedDownPayment = itemValueNum - disbursementAmount;
  const loanAmount          = selectedPlan?.loanAmount ?? 0;
  const avFee               = selectedPlan?.avFee ?? 200;
  const appLockFee          = selectedPlan?.appLockFee ?? 150;
  const totalCharges        = selectedPlan?.totalCharges ?? (loanAmount - disbursementAmount);
  const actualProcessingFee = selectedPlan ? selectedPlan.actualProcessingFee : Math.max(0, totalCharges - avFee - appLockFee);

  const blockStyle = { borderRadius: '12px', border: '1px solid #e5e7eb', padding: '10px 12px', background: '#fafafa', marginBottom: '10px' };
  const headStyle  = { fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#111827' };
  const lineStyle  = { fontSize: '13px', color: '#374151', marginBottom: '3px' };

  return (
    <section>
      <h3 style={{ fontSize: '22px', marginBottom: '10px', color: '#111827' }}>Preview & Consent</h3>

      <div style={blockStyle}>
        <div style={headStyle}>Retailer</div>
        <div style={lineStyle}>{retailer?.shop_name || '-'}{retailer?.city ? ` • ${retailer.city}` : ''}</div>
      </div>

      <div style={blockStyle}>
        <div style={headStyle}>Customer Profile</div>
        <div style={lineStyle}><strong>{form.customerName || '-'}</strong></div>
        <div style={lineStyle}>{form.customerPhone || '-'}</div>
        {form.customerEmail && <div style={lineStyle}>{form.customerEmail}</div>}
        <div style={lineStyle}>DOB: {form.customerDob || '-'}</div>
        <div style={{ ...lineStyle, marginTop: '4px' }}>Address: {form.customerAddress || '-'}</div>
      </div>

      <div style={blockStyle}>
        <div style={headStyle}>KYC Information</div>
        <div style={lineStyle}>Aadhaar: {form.aadharNumber || '-'}</div>
        <div style={lineStyle}>PAN: {form.panNumber || '-'}</div>
        <div style={lineStyle}>Account: {form.accountNumber || '-'}</div>
        <div style={lineStyle}>IFSC: {form.ifscCode || '-'}</div>
      </div>

      <div style={blockStyle}>
        <div style={headStyle}>Device & Finance</div>
        <div style={lineStyle}>Device: {form.itemName || '-'}</div>
        <div style={lineStyle}>Item Value: {itemValueNum ? `₹ ${itemValueNum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}</div>
        <div style={lineStyle}>Device Type: {form.deviceType || 'ANDROID'}</div>
        {form.itemImei && <div style={lineStyle}>IMEI: {form.itemImei}</div>}
        <div style={lineStyle}>
          Downpayment: {Number.isFinite(adjustedDownPayment) ? `₹ ${adjustedDownPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}
        </div>
        <div style={lineStyle}>
          Net Disbursement: {Number.isFinite(disbursementAmount) ? `₹ ${disbursementAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}
        </div>
      </div>

      {selectedPlan && (
        <div style={blockStyle}>
          <div style={headStyle}>Selected Plan</div>
          <div style={lineStyle}>Plan: {selectedPlan.label} • {selectedPlan.months} month{selectedPlan.months > 1 ? 's' : ''}</div>
          <div style={lineStyle}>Loan Amount: ₹ {loanAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={lineStyle}>Monthly EMI: ₹ {selectedPlan.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={lineStyle}>Tenure: {selectedPlan.months} months</div>
          <div style={lineStyle}>Last Repayment Date: {selectedPlan.lastRepaymentDate}</div>
        </div>
      )}

      {selectedPlan && (
        <div style={blockStyle}>
          <div style={headStyle}>Processing Fee Breakdown</div>
          <div style={lineStyle}>AV Management Fee: ₹ {avFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={lineStyle}>App Lock Fee: ₹ {appLockFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={lineStyle}>Processing Fee: ₹ {actualProcessingFee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div style={{ ...lineStyle, borderTop: '2px solid #1e40af', paddingTop: '6px', marginTop: '6px', color: '#1e40af', fontWeight: '700' }}>
            Total Charges: ₹ {totalCharges.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      )}

<div style={{ ...fieldGroupStyle, marginTop: '4px' }}>
        <label style={{ ...labelStyle, display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            style={{ marginTop: '3px' }}
          />
          <span style={{ fontSize: '13px', color: '#374151' }}>
            I confirm that the above details are correct and I accept the loan terms on behalf of the customer.
          </span>
        </label>
      </div>
    </section>
  );
}