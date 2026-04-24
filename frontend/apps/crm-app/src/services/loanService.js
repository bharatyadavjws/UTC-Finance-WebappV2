import { authService } from './authService';

const API_BASE = 'http://127.0.0.1:8000/api';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function getHeaders(extra = {}) {
  const token = authService.getToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function getMultipartHeaders() {
  const token = authService.getToken();
  return {
    Accept: 'application/json',
    // ⚠️ Do NOT set Content-Type for FormData — browser sets it with boundary
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  const data = await response.json();

  if (response.status === 401) {
    authService.removeToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ─────────────────────────────────────────────
//  Loan Service
// ─────────────────────────────────────────────

export const loanService = {

  // ── Loan CRUD ──────────────────────────────

  /**
   * Fetch all loans (filtered by agent role on backend)
   */
  async getLoans(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_BASE}/loans${query ? `?${query}` : ''}`,
      { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  /**
   * Create a new loan application (multipart/form-data with documents)
   */
  async createLoan(formData) {
    const response = await fetch(`${API_BASE}/loans`, {
      method: 'POST',
      headers: getMultipartHeaders(),
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Get full loan details by loan code
   */
  async getLoanDetails(loanCode) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update loan application (e.g. fix details before approval)
   * Uses multipart when files are included, JSON otherwise
   */
  async updateLoan(loanCode, formData) {
    const isFormData = formData instanceof FormData;
    if (isFormData) {
      // Laravel requires _method override for PUT with FormData
      formData.append('_method', 'PUT');
    }
    const response = await fetch(`${API_BASE}/loans/${loanCode}`, {
      method: isFormData ? 'POST' : 'PUT',
      headers: isFormData ? getMultipartHeaders() : getHeaders(),
      body: isFormData ? formData : JSON.stringify(formData),
    });
    return handleResponse(response);
  },

  /**
   * Delete / withdraw a loan application (only if pending)
   */
  async deleteLoan(loanCode) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ── Loan Status & Workflow ─────────────────

  /**
   * Approve a loan (UTC team only)
   */
  async approveLoan(loanCode, payload = {}) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  /**
   * Reject a loan with a reason
   */
  async rejectLoan(loanCode, reason) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  /**
   * Mark loan as disbursed (funds sent to retailer/borrower)
   */
  async disburseLoan(loanCode, payload = {}) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}/disburse`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  /**
   * Mark loan as closed / fully repaid
   */
  async closeLoan(loanCode) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}/close`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ── EMI & Repayments ───────────────────────

  /**
   * Get full EMI schedule for a loan
   */
  async getEmiSchedule(loanCode) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/emi-schedule`,
      { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  /**
   * Get all EMI payments recorded against a loan
   */
  async getRepayments(loanCode) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/repayments`,
      { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  /**
   * Record a manual EMI payment (cash / offline)
   * payload: { amount, payment_date, payment_mode, reference_number?, note? }
   */
  async recordRepayment(loanCode, payload) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/repayments`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse(response);
  },

  /**
   * Initiate Razorpay order for an EMI payment
   * Returns { order_id, amount, currency, key }
   */
  async initiateEmiPayment(loanCode, emiId) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/repayments/${emiId}/initiate`,
      {
        method: 'POST',
        headers: getHeaders(),
      }
    );
    return handleResponse(response);
  },

  /**
   * Verify Razorpay payment and mark EMI as paid
   * payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  async verifyEmiPayment(loanCode, emiId, payload) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/repayments/${emiId}/verify`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse(response);
  },

  // ── Documents & KYC ───────────────────────

  /**
   * Upload / replace a KYC document for a loan
   * formData fields: { document_type, file }
   * document_type: 'aadhar_front' | 'aadhar_back' | 'pan' | 'income_proof' | 'photo' | 'agreement'
   */
  async uploadDocument(loanCode, formData) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/documents`,
      {
        method: 'POST',
        headers: getMultipartHeaders(),
        body: formData,
      }
    );
    return handleResponse(response);
  },

  /**
   * Get all documents attached to a loan
   */
  async getDocuments(loanCode) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/documents`,
      { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  /**
   * Delete a specific document
   */
  async deleteDocument(loanCode, documentId) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/documents/${documentId}`,
      { method: 'DELETE', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  // ── Agreement (PDF) ────────────────────────

  /**
   * Generate & fetch the loan agreement PDF URL
   * Returns { url: '...signed_url...' }
   */
  async getAgreementUrl(loanCode) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/agreement`,
      { method: 'GET', headers: getHeaders() }
    );
    return handleResponse(response);
  },

  /**
   * Mark agreement as signed by borrower (after e-sign / OTP confirmation)
   */
  async signAgreement(loanCode, payload = {}) {
    const response = await fetch(
      `${API_BASE}/loans/${loanCode}/agreement/sign`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse(response);
  },

  // Add this to loanService.js
  async updateStatus(loanCode, payload) {
    const response = await fetch(`${API_BASE}/loans/${loanCode}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // ── Eligibility ────────────────────────────

  /**
   * Run eligibility check before creating a loan
   * payload: { monthly_income, existing_emis, cibil_score, loan_amount, tenure_months }
   * Returns { eligible: bool, max_amount, recommended_tenure, reason? }
   */
  async checkEligibility(payload) {
    const response = await fetch(`${API_BASE}/loans/eligibility`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // ── Utility ────────────────────────────────

  /**
   * Calculate EMI amount locally (no API call needed)
   * principal: ₹, annualRate: % (e.g. 18), tenureMonths: number
   */
  calculateEmi(principal, annualRate, tenureMonths) {
    if (!principal || !annualRate || !tenureMonths) return 0;
    const r = annualRate / 12 / 100;
    const n = tenureMonths;
    if (r === 0) return Math.round(principal / n);
    const emi =
      (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  },

  /**
   * Build full EMI schedule locally (useful for preview before submission)
   */
  buildEmiSchedule(principal, annualRate, tenureMonths, startDate) {
    const emi = this.calculateEmi(principal, annualRate, tenureMonths);
    const r = annualRate / 12 / 100;
    let balance = principal;
    const schedule = [];
    let date = new Date(startDate);

    for (let i = 1; i <= tenureMonths; i++) {
      const interest = Math.round(balance * r);
      const principalPart = emi - interest;
      balance -= principalPart;

      schedule.push({
        emi_number: i,
        due_date: date.toISOString().split('T')[0],
        emi_amount: emi,
        principal: principalPart,
        interest,
        balance: Math.max(0, Math.round(balance)),
        status: 'pending',
      });

      date = new Date(date.setMonth(date.getMonth() + 1));
    }

    return schedule;
  },
};