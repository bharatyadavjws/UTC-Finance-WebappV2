// src/utils/loanUtils.js

export const TENURE_OPTIONS = [
    { key: 'RAPID', label: 'Rapid', months: 1 },
    { key: 'E3', label: 'E3', months: 3 },
    { key: 'E6', label: 'E6', months: 6 },
    { key: 'E9', label: 'E9', months: 9 },
    { key: 'E12', label: 'E12', months: 12 },
  ];
  
  export function getAllowedTenuresByDisbursement(disbursementAmount) {
    const d = Number(disbursementAmount) || 0;
    if (d <= 5000) return ['RAPID', 'E3'];
    if (d <= 10000) return ['RAPID', 'E3', 'E6'];
    if (d <= 30000) return ['RAPID', 'E3', 'E6', 'E9'];
    return ['RAPID', 'E3', 'E6', 'E9', 'E12'];
  }
  
  export function getMinimumDownPayment(itemValue) {
    const num = Number(itemValue) || 0;
    if (num <= 20000) return Math.ceil(num * 0.3);
    if (num <= 35000) return Math.ceil(num * 0.3);
    if (num <= 50000) return Math.ceil(num * 0.25);
    return Math.ceil(num * 0.2);
  }
  
  export function computeApprovedCreditLimit(itemValue, downPayment, income, cibil, existingEmi) {
    const inc = Number(income) || 0;
    const cib = Number(cibil) || 0;
    const currEmi = Number(existingEmi) || 0;
  
    if (inc < 10000) return { ok: false, error: "Minimum income required is ₹10,000." };
    
    // 1. FOIR GATE (Debt-to-income check)
    const foir = inc > 0 ? (currEmi / inc) * 100 : 0;
    let maxFoir = 0;
    if (inc <= 20000) maxFoir = 50;
    else if (inc <= 30000) maxFoir = 55;
    else if (inc <= 50000) maxFoir = 60;
    else if (inc <= 75000) maxFoir = 70;
    else maxFoir = 75;
  
    if (foir > maxFoir) {
      return { ok: false, error: `Ineligible: FOIR (${foir.toFixed(1)}%) exceeds limit for this income (${maxFoir}%).` };
    }
  
    // 2. CIBIL GATE
    let cibilCap = 0;
    if (cib === 0) cibilCap = 15000;
    else if (cib >= 750) cibilCap = 35000;
    else if (cib >= 725) cibilCap = 33000;
    else if (cib >= 700) cibilCap = 30000;
    else if (cib >= 675) cibilCap = 26000;
    else if (cib >= 650) cibilCap = 21000;
    else return { ok: false, error: "CIBIL score too low for eligibility." };
  
    return { ok: true, creditLimit: Math.min(cibilCap, 35000) };
  }
  
  export function calculateEmiOptions(itemValue, downPayment, deviceType = "ANDROID") {
    const item = Number(itemValue) || 0;
    const down = Number(downPayment) || 0;
    const disbursementAmount = Math.max(item - down, 0);
    if (disbursementAmount <= 0) return [];
  
    const AV_FEE = 200;
    const LOCK_FEE = deviceType === "IOS" ? 400 : 150;
    
    // FIXED MATH: base + fees = 90% of Loan. 10% is PF.
    const baseForLoan = disbursementAmount + AV_FEE + LOCK_FEE;
    const loanAmount = Math.ceil(baseForLoan / 0.9); 
    
    const allowedKeys = getAllowedTenuresByDisbursement(disbursementAmount);
    const filteredTenures = TENURE_OPTIONS.filter(t => allowedKeys.includes(t.key));
    const dailyRate = 0.00065753424658; // 24% p.a.
  
    return filteredTenures.map(t => {
      const months = t.months;
      const days = months * 30; 
      const interest = loanAmount * dailyRate * days;
      const totalRepay = loanAmount + interest;
      return {
        key: t.key, label: t.label, months, loanAmount, netDisbursement: disbursementAmount,
        emi: Math.ceil(totalRepay / months), totalRepay
      };
    });
  }
  