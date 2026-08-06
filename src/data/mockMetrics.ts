// Mock metrics data for admin dashboard development and demo mode
// Matches the shape of GET /api/admin/metrics response

function generateLast30Days() {
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const last30 = generateLast30Days();

export const mockMetrics = {
  total_customers: 450,
  customer_growth_rate: 15.5,
  mrr_inr: 21600,
  mrr_usd: 21600,
  mrr_growth_rate: 12.3,
  calls_today: 3500,
  calls_growth: 8.2,
  active_calls: 14,
  payment_success_rate: 98.5,

  countries: [
    { code: 'US', name: 'USA', customer_count: 380, mrr: 18240, mrr_usd: 18240, currency: '$', churn: 1.8 },
    { code: 'CA', name: 'Canada', customer_count: 50, mrr: 2400, mrr_usd: 2400, currency: '$', churn: 1.5 },
    { code: 'MX', name: 'Mexico', customer_count: 20, mrr: 960, mrr_usd: 960, currency: '$', churn: 2.2 },
  ],

  revenue_by_country: [
    { country: 'USA', code: 'US', revenue_usd: 18240, revenue_local: 18240, currency: '$' },
    { country: 'Canada', code: 'CA', revenue_usd: 2400, revenue_local: 2400, currency: '$' },
    { country: 'Mexico', code: 'MX', revenue_usd: 960, revenue_local: 960, currency: '$' },
  ],

  call_volume_trend: last30.map((date, i) => ({
    date,
    calls: Math.floor(2200 + Math.sin(i * 0.4) * 600 + i * 40 + Math.random() * 200),
  })),

  mrr_trend: last30.map((date, i) => ({
    date,
    mrr: Math.floor(18000 + i * 120 + Math.sin(i * 0.3) * 800),
  })),

  churn_by_country: {
    US: 1.8,
    CA: 1.5,
    MX: 2.2,
  },

  peak_hours: {
    US: [15, 12, 8, 5, 3, 2, 1, 0, 2, 8, 25, 40, 48, 52, 55, 50, 42, 35, 30, 28, 25, 22, 20, 18],
    CA: [12, 10, 7, 4, 2, 1, 0, 1, 4, 10, 20, 35, 42, 48, 50, 48, 40, 32, 28, 25, 22, 20, 18, 15],
    MX: [10, 8, 5, 3, 1, 0, 0, 2, 6, 12, 22, 38, 45, 50, 52, 48, 42, 35, 28, 22, 20, 18, 15, 12],
  },

  top_customers: [
    { id: '1', email: 'john@sunstarproperties.com', business_name: 'Sunstar Properties', country: 'USA', country_code: 'US', plan: 'scale', revenue: 149, currency: '$', total_calls: 4200, total_minutes: 8400 },
    { id: '2', email: 'sarah@healthfirst.com', business_name: 'HealthFirst Clinics', country: 'USA', country_code: 'US', plan: 'scale', revenue: 149, currency: '$', total_calls: 3800, total_minutes: 6200 },
    { id: '3', email: 'john@acmecorp.com', business_name: 'Acme Corporation', country: 'USA', country_code: 'US', plan: 'scale', revenue: 149, currency: '$', total_calls: 2800, total_minutes: 4500 },
    { id: '4', email: 'lisa@bostonlegal.com', business_name: 'Boston Legal Partners', country: 'USA', country_code: 'US', plan: 'scale', revenue: 149, currency: '$', total_calls: 1900, total_minutes: 3200 },
    { id: '5', email: 'alex@dreamhomes.com', business_name: 'Dream Homes Realty', country: 'USA', country_code: 'US', plan: 'growth', revenue: 79, currency: '$', total_calls: 3200, total_minutes: 5100 },
    { id: '6', email: 'mike@seattledental.com', business_name: 'Seattle Dental Group', country: 'USA', country_code: 'US', plan: 'growth', revenue: 79, currency: '$', total_calls: 1500, total_minutes: 2400 },
    { id: '7', email: 'derek@austinlux.com', business_name: 'Austin Luxury Motors', country: 'USA', country_code: 'US', plan: 'scale', revenue: 149, currency: '$', total_calls: 1200, total_minutes: 1800 },
    { id: '8', email: 'steve@edulearn.com', business_name: 'EduLearn Academy', country: 'USA', country_code: 'US', plan: 'growth', revenue: 79, currency: '$', total_calls: 2100, total_minutes: 3500 },
    { id: '9', email: 'james@nyfinance.com', business_name: 'NY Finance Group', country: 'USA', country_code: 'US', plan: 'growth', revenue: 79, currency: '$', total_calls: 1800, total_minutes: 2900 },
    { id: '10', email: 'robert@chicagomutual.com', business_name: 'Chicago Mutual Insurance', country: 'USA', country_code: 'US', plan: 'growth', revenue: 79, currency: '$', total_calls: 900, total_minutes: 1400 },
  ],
};

export type AdminMetrics = typeof mockMetrics;
