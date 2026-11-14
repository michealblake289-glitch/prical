import React, { useState } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function calculateDurationBreakdown(startDate, endDate) {
  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function SentenceCalculator() {
  const [formData, setFormData] = useState({
    start_day: '',
    start_month: '',
    start_year: '',
    sentence_years: '',
    sentence_months: '',
    sentence_days: '',
    offender_type: 'FirstOffender',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestData = {
        start_day: Number(formData.start_day),
        start_month: Number(formData.start_month),
        start_year: Number(formData.start_year),
        sentence_years: Number(formData.sentence_years) || 0,
        sentence_months: Number(formData.sentence_months) || 0,
        sentence_days: Number(formData.sentence_days) || 0,
        offender_type: formData.offender_type,
      };

      const response = await fetch(`${API}/calculate-sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Request failed');
      setResult(payload);
    } catch (err) {
      setError(err.message || 'An error occurred while calculating the sentence');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      start_day: '',
      start_month: '',
      start_year: '',
      sentence_years: '',
      sentence_months: '',
      sentence_days: '',
      offender_type: 'FirstOffender',
    });
    setResult(null);
    setError('');
  };

  return (
    <div>
      <div className="card mb-8">
        <h2>Sentence Details</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>Start Day</label>
              <input type="number" name="start_day" value={formData.start_day} onChange={handleInputChange} min="1" max="31" required placeholder="15" />
            </div>
            <div>
              <label>Start Month</label>
              <input type="number" name="start_month" value={formData.start_month} onChange={handleInputChange} min="1" max="12" required placeholder="6" />
            </div>
            <div>
              <label>Start Year</label>
              <input type="number" name="start_year" value={formData.start_year} onChange={handleInputChange} min="1900" max="3000" required placeholder="2024" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>Sentence Years</label>
              <input type="number" name="sentence_years" value={formData.sentence_years} onChange={handleInputChange} min="0" placeholder="5" />
            </div>
            <div>
              <label>Sentence Months</label>
              <input type="number" name="sentence_months" value={formData.sentence_months} onChange={handleInputChange} min="0" placeholder="6" />
            </div>
            <div>
              <label>Sentence Days</label>
              <input type="number" name="sentence_days" value={formData.sentence_days} onChange={handleInputChange} min="0" placeholder="15" />
            </div>
          </div>

          <div>
            <label>Offender Type</label>
            <select name="offender_type" value={formData.offender_type} onChange={handleInputChange} required>
              <option value="FirstOffender">First Offender (1/3 remission)</option>
              <option value="SecondOffender">Second Offender (1/4 remission)</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Calculating...' : 'Calculate Sentence'}</button>
            <button type="button" className="secondary-btn" onClick={resetForm}>Reset</button>
          </div>
        </form>

        {error && (
          <div className="error-box mt-6">
            <p>{error}</p>
          </div>
        )}
      </div>

      {result && (
        <div className="card">
          <h2>Calculation Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="result-box blue">
                <h3>Summary</h3>
                <p><strong>Offender Type:</strong> {result.offender_type}</p>
                <p><strong>Start Date:</strong> {result.start_date}</p>
                <p><strong>Total Sentence Duration:</strong> {result.total_sentence_days} days</p>
              </div>

              <div className="result-box green">
                <h3>Earliest Date of Release (EDR)</h3>
                <p>{result.earliest_date_of_release} ({result.earliest_date_day_name})</p>
              </div>

              <div className="result-box orange">
                <h3>Latest Date of Release (LDR)</h3>
                <p>{result.latest_date_of_release} ({result.latest_date_day_name})</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="result-box grey">
                <h3>Duration from Start Date to EDR</h3>
                <p>{result.duration_start_to_edr.years} years, {result.duration_start_to_edr.months} months, {result.duration_start_to_edr.days} days</p>
              </div>

              <div className="result-box grey">
                <h3>Duration from Start Date to LDR</h3>
                <p>{result.duration_start_to_ldr.years} years, {result.duration_start_to_ldr.months} months, {result.duration_start_to_ldr.days} days</p>
              </div>

              <div className="result-box purple">
                <h3>Remission Information</h3>
                <p>{result.offender_type === 'FirstOffender' ? 'First offenders receive 1/3 remission of their sentence' : 'Second offenders receive 1/4 remission of their sentence'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FineCalculator() {
  const [formData, setFormData] = useState({
    start_day: '',
    start_month: '',
    start_year: '',
    sentence_years: '',
    sentence_months: '',
    sentence_days: '',
    paid_day: '',
    paid_month: '',
    paid_year: '',
    offender_type: 'FirstOffender',
    total_fine: '',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestData = {
        start_day: Number(formData.start_day),
        start_month: Number(formData.start_month),
        start_year: Number(formData.start_year),
        sentence_years: Number(formData.sentence_years) || 0,
        sentence_months: Number(formData.sentence_months) || 0,
        sentence_days: Number(formData.sentence_days) || 0,
        paid_day: Number(formData.paid_day),
        paid_month: Number(formData.paid_month),
        paid_year: Number(formData.paid_year),
        offender_type: formData.offender_type,
        total_fine: Number(formData.total_fine),
      };

      const response = await fetch(`${API}/calculate-fine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Request failed');
      setResult(payload);
    } catch (err) {
      setError(err.message || 'An error occurred while calculating the fine');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      start_day: '',
      start_month: '',
      start_year: '',
      sentence_years: '',
      sentence_months: '',
      sentence_days: '',
      paid_day: '',
      paid_month: '',
      paid_year: '',
      offender_type: 'FirstOffender',
      total_fine: '',
    });
    setResult(null);
    setError('');
  };

  return (
    <div>
      <div className="card mb-8">
        <h2>Fine Payable Calculator</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3>Start Date</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label>Start Day</label>
                <input type="number" name="start_day" value={formData.start_day} onChange={handleInputChange} min="1" max="31" required />
              </div>
              <div>
                <label>Start Month</label>
                <input type="number" name="start_month" value={formData.start_month} onChange={handleInputChange} min="1" max="12" required />
              </div>
              <div>
                <label>Start Year</label>
                <input type="number" name="start_year" value={formData.start_year} onChange={handleInputChange} min="1900" max="3000" required />
              </div>
            </div>
          </div>

          <div>
            <h3>Sentence Duration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label>Sentence Years</label>
                <input type="number" name="sentence_years" value={formData.sentence_years} onChange={handleInputChange} min="0" />
              </div>
              <div>
                <label>Sentence Months</label>
                <input type="number" name="sentence_months" value={formData.sentence_months} onChange={handleInputChange} min="0" />
              </div>
              <div>
                <label>Sentence Days</label>
                <input type="number" name="sentence_days" value={formData.sentence_days} onChange={handleInputChange} min="0" />
              </div>
            </div>
          </div>

          <div>
            <h3>Date Paid</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label>Day Paid</label>
                <input type="number" name="paid_day" value={formData.paid_day} onChange={handleInputChange} min="1" max="31" required />
              </div>
              <div>
                <label>Month Paid</label>
                <input type="number" name="paid_month" value={formData.paid_month} onChange={handleInputChange} min="1" max="12" required />
              </div>
              <div>
                <label>Year Paid</label>
                <input type="number" name="paid_year" value={formData.paid_year} onChange={handleInputChange} min="1900" max="3000" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Offender Type</label>
              <select name="offender_type" value={formData.offender_type} onChange={handleInputChange} required>
                <option value="FirstOffender">First Offender (1/3 remission)</option>
                <option value="SecondOffender">Second Offender (1/4 remission)</option>
              </select>
            </div>
            <div>
              <label>Total Fine Amount ($)</label>
              <input type="number" step="0.01" name="total_fine" value={formData.total_fine} onChange={handleInputChange} min="0" required placeholder="5000.00" />
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="primary-btn green" disabled={loading}>{loading ? 'Calculating...' : 'Calculate Fine Payable'}</button>
            <button type="button" className="secondary-btn" onClick={resetForm}>Reset</button>
          </div>
        </form>

        {error && (
          <div className="error-box mt-6">
            <p>{error}</p>
          </div>
        )}
      </div>

      {result && (
        <div className="card">
          <h2>Fine Calculation Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="result-box blue">
                <h3>Summary</h3>
                <p><strong>Offender Type:</strong> {result.offender_type}</p>
                <p><strong>Start Date:</strong> {result.start_date}</p>
                <p><strong>Date Paid:</strong> {result.paid_date}</p>
                <p><strong>Total Fine:</strong> ${Number(result.total_fine).toFixed(2)}</p>
              </div>

              <div className="result-box green">
                <h3>Sentence Information</h3>
                <p><strong>EDR:</strong> {result.earliest_date_of_release} ({result.edr_days} days)</p>
                <p><strong>LDR:</strong> {result.latest_date_of_release} ({result.ldr_days} days)</p>
                <p><strong>Total Sentence:</strong> {result.total_sentence_days} days</p>
              </div>

              <div className="result-box purple">
                <h3>Payment Details</h3>
                <p><strong>Days Served Until Payment:</strong> {result.paid_days_from_start} days</p>
                <p><strong>Days Not Served:</strong> {result.days_not_served} days</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="result-box yellow">
                <h3>Fine Calculation Formula</h3>
                <p>Fine Payable = (Days Not Served × Total Fine) / LDR Duration</p>
                <p>{result.days_not_served} × ${Number(result.total_fine).toFixed(2)} / {result.ldr_days}</p>
              </div>

              <div className="result-box red">
                <h3>Fine Payable</h3>
                <p className="amount">${Number(result.fine_payable).toFixed(2)}</p>
              </div>

              <div className="result-box grey">
                <h3>Duration Breakdown</h3>
                <p><strong>Start to EDR:</strong> {result.duration_start_to_edr.years}y, {result.duration_start_to_edr.months}m, {result.duration_start_to_edr.days}d</p>
                <p><strong>Start to LDR:</strong> {result.duration_start_to_ldr.years}y, {result.duration_start_to_ldr.months}m, {result.duration_start_to_ldr.days}d</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('sentence');

  return (
    <div className="app-shell">
      <div className="container">
        <h1>Prison Sentence & Fine Calculator</h1>
        <p className="subtitle">Calculate sentence duration, release dates and fine payable</p>

        <nav className="tabs">
          <button className={activeTab === 'sentence' ? 'tab active blue' : 'tab blue'} onClick={() => setActiveTab('sentence')}>
            Sentence Calculator
          </button>
          <button className={activeTab === 'fine' ? 'tab active green' : 'tab green'} onClick={() => setActiveTab('fine')}>
            Fine Payable Calculator
          </button>
        </nav>

        {activeTab === 'sentence' ? <SentenceCalculator /> : <FineCalculator />}

        <div className="footer-note">
          <p>This calculator follows the same logic as the original C# implementation. by CO1 Blake R.M.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
