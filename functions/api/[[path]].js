const sentenceHistory = [];
const fineHistory = [];
const statusHistory = [];

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...(init.headers || {}),
    },
  });
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

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function calculateSentence(req) {
  const startDate = new Date(req.start_year, req.start_month - 1, req.start_day);
  let endDate = new Date(startDate);

  if (req.sentence_years > 0) endDate.setFullYear(endDate.getFullYear() + req.sentence_years);
  if (req.sentence_months > 0) endDate.setMonth(endDate.getMonth() + req.sentence_months);
  if (req.sentence_days > 0) endDate.setDate(endDate.getDate() + req.sentence_days);

  const totalDays = Math.max(0, Math.round((endDate - startDate) / 86400000));
  const remissionPercentage = req.offender_type === 'FirstOffender' ? 1 / 3 : 1 / 4;
  const remissionDays = Math.floor(totalDays * remissionPercentage);

  const edrDate = new Date(startDate);
  edrDate.setDate(edrDate.getDate() + (totalDays - remissionDays - 1));

  const ldrDate = new Date(endDate);
  ldrDate.setDate(ldrDate.getDate() - 1);

  return {
    id: crypto.randomUUID(),
    offender_type: req.offender_type,
    start_date: formatDate(startDate),
    total_sentence_days: totalDays,
    earliest_date_of_release: formatDate(edrDate),
    earliest_date_day_name: edrDate.toLocaleDateString('en-US', { weekday: 'long' }),
    latest_date_of_release: formatDate(ldrDate),
    latest_date_day_name: ldrDate.toLocaleDateString('en-US', { weekday: 'long' }),
    duration_start_to_edr: calculateDurationBreakdown(startDate, edrDate),
    duration_start_to_ldr: calculateDurationBreakdown(startDate, ldrDate),
    calculation_timestamp: new Date().toISOString(),
  };
}

function calculateFine(req) {
  const startDate = new Date(req.start_year, req.start_month - 1, req.start_day);
  const paidDate = new Date(req.paid_year, req.paid_month - 1, req.paid_day);

  let endDate = new Date(startDate);
  if (req.sentence_years > 0) endDate.setFullYear(endDate.getFullYear() + req.sentence_years);
  if (req.sentence_months > 0) endDate.setMonth(endDate.getMonth() + req.sentence_months);
  if (req.sentence_days > 0) endDate.setDate(endDate.getDate() + req.sentence_days);

  const totalDays = Math.max(0, Math.round((endDate - startDate) / 86400000));
  const remissionPercentage = req.offender_type === 'FirstOffender' ? 1 / 3 : 1 / 4;
  const remissionDays = Math.floor(totalDays * remissionPercentage);

  const edrDate = new Date(startDate);
  edrDate.setDate(edrDate.getDate() + (totalDays - remissionDays - 1));

  const ldrDate = new Date(endDate);
  ldrDate.setDate(ldrDate.getDate() - 1);

  const edrDays = Math.max(0, Math.round((edrDate - startDate) / 86400000));
  const ldrDays = Math.max(0, Math.round((ldrDate - startDate) / 86400000));
  const paidDaysFromStart = Math.max(0, Math.round((paidDate - startDate) / 86400000));
  const daysNotServed = ldrDays - paidDaysFromStart;
  const finePayable = ldrDays > 0 ? (daysNotServed * req.total_fine) / ldrDays : 0;

  return {
    id: crypto.randomUUID(),
    offender_type: req.offender_type,
    start_date: formatDate(startDate),
    paid_date: formatDate(paidDate),
    total_sentence_days: totalDays,
    earliest_date_of_release: formatDate(edrDate),
    earliest_date_day_name: edrDate.toLocaleDateString('en-US', { weekday: 'long' }),
    latest_date_of_release: formatDate(ldrDate),
    latest_date_day_name: ldrDate.toLocaleDateString('en-US', { weekday: 'long' }),
    edr_days: edrDays,
    ldr_days: ldrDays,
    paid_days_from_start: paidDaysFromStart,
    days_not_served: daysNotServed,
    total_fine: req.total_fine,
    fine_payable: finePayable,
    duration_start_to_edr: calculateDurationBreakdown(startDate, edrDate),
    duration_start_to_ldr: calculateDurationBreakdown(startDate, ldrDate),
    calculation_timestamp: new Date().toISOString(),
  };
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const path = url.pathname.replace(/^\/api\/?/, '');

  if (request.method === 'GET' && path === '') {
    return jsonResponse({ message: 'Prison Sentence & Fine Calculator API' });
  }

  if (request.method === 'GET' && path === 'status') {
    return jsonResponse(statusHistory);
  }

  if (request.method === 'GET' && path === 'sentence-history') {
    return jsonResponse(sentenceHistory);
  }

  if (request.method === 'GET' && path === 'fine-history') {
    return jsonResponse(fineHistory);
  }

  if (request.method === 'POST' && path === 'status') {
    const body = await request.json();
    const status = {
      id: crypto.randomUUID(),
      client_name: body.client_name,
      timestamp: new Date().toISOString(),
    };
    statusHistory.push(status);
    return jsonResponse(status);
  }

  if (request.method === 'POST' && path === 'calculate-sentence') {
    try {
      const body = await request.json();
      const result = calculateSentence(body);
      sentenceHistory.unshift(result);
      if (sentenceHistory.length > 50) sentenceHistory.length = 50;
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ detail: error.message || 'Calculation failed' }, { status: 400 });
    }
  }

  if (request.method === 'POST' && path === 'calculate-fine') {
    try {
      const body = await request.json();
      const result = calculateFine(body);
      fineHistory.unshift(result);
      if (fineHistory.length > 50) fineHistory.length = 50;
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ detail: error.message || 'Calculation failed' }, { status: 400 });
    }
  }

  return jsonResponse({ detail: 'Not found' }, { status: 404 });
}
