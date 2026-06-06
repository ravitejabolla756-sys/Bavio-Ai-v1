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
  mrr_inr: 1800000,
  mrr_usd: 21600,
  mrr_growth_rate: 12.3,
  calls_today: 3500,
  calls_growth: 8.2,
  active_calls: 14,
  payment_success_rate: 98.5,

  countries: [
    { code: 'IN', name: 'India', customer_count: 300, mrr: 1200000, mrr_usd: 14400, currency: '₹', churn: 2.1 },
    { code: 'US', name: 'USA', customer_count: 80, mrr: 6320, mrr_usd: 6320, currency: '$', churn: 1.8 },
    { code: 'GB', name: 'United Kingdom', customer_count: 30, mrr: 1770, mrr_usd: 2248, currency: '£', churn: 1.2 },
    { code: 'AU', name: 'Australia', customer_count: 25, mrr: 2475, mrr_usd: 1634, currency: 'AUD ', churn: 2.8 },
    { code: 'AE', name: 'UAE', customer_count: 15, mrr: 4485, mrr_usd: 1211, currency: 'AED ', churn: 0.9 },
  ],

  revenue_by_country: [
    { country: 'India', code: 'IN', revenue_usd: 14400, revenue_local: 1200000, currency: '₹' },
    { country: 'USA', code: 'US', revenue_usd: 6320, revenue_local: 6320, currency: '$' },
    { country: 'United Kingdom', code: 'GB', revenue_usd: 2248, revenue_local: 1770, currency: '£' },
    { country: 'Australia', code: 'AU', revenue_usd: 1634, revenue_local: 2475, currency: 'AUD ' },
    { country: 'UAE', code: 'AE', revenue_usd: 1211, revenue_local: 4485, currency: 'AED ' },
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
    IN: 2.1,
    US: 1.8,
    GB: 1.2,
    AU: 2.8,
    AE: 0.9,
  },

  peak_hours: {
    IN: [2, 1, 0, 0, 0, 1, 5, 18, 42, 65, 80, 72, 55, 48, 52, 60, 70, 58, 35, 20, 12, 8, 5, 3],
    US: [15, 12, 8, 5, 3, 2, 1, 0, 2, 8, 25, 40, 48, 52, 55, 50, 42, 35, 30, 28, 25, 22, 20, 18],
    GB: [5, 3, 1, 0, 0, 0, 2, 8, 22, 38, 50, 55, 48, 42, 45, 48, 40, 30, 18, 10, 8, 6, 5, 4],
    AU: [8, 5, 2, 1, 0, 0, 3, 12, 28, 35, 42, 38, 30, 25, 22, 20, 15, 10, 6, 4, 5, 8, 10, 9],
    AE: [3, 2, 1, 0, 0, 0, 2, 8, 18, 32, 40, 38, 25, 20, 22, 28, 32, 28, 15, 8, 5, 4, 3, 3],
  },

  top_customers: [
    { id: '1', email: 'raj@sunstarproperties.in', business_name: 'Sunstar Properties', country: 'India', country_code: 'IN', plan: 'scale', revenue: 7999, currency: '₹', total_calls: 4200, total_minutes: 8400 },
    { id: '2', email: 'priya@healthfirst.in', business_name: 'HealthFirst Clinics', country: 'India', country_code: 'IN', plan: 'scale', revenue: 7999, currency: '₹', total_calls: 3800, total_minutes: 6200 },
    { id: '3', email: 'john@acmecorp.com', business_name: 'Acme Corporation', country: 'USA', country_code: 'US', plan: 'scale', revenue: 149, currency: '$', total_calls: 2800, total_minutes: 4500 },
    { id: '4', email: 'sarah@londonlegal.co.uk', business_name: 'London Legal Partners', country: 'United Kingdom', country_code: 'GB', plan: 'scale', revenue: 99, currency: '£', total_calls: 1900, total_minutes: 3200 },
    { id: '5', email: 'amit@dreamhomes.in', business_name: 'Dream Homes Realty', country: 'India', country_code: 'IN', plan: 'growth', revenue: 3999, currency: '₹', total_calls: 3200, total_minutes: 5100 },
    { id: '6', email: 'mike@sydneydental.com.au', business_name: 'Sydney Dental Group', country: 'Australia', country_code: 'AU', plan: 'growth', revenue: 99, currency: 'AUD ', total_calls: 1500, total_minutes: 2400 },
    { id: '7', email: 'ahmed@dubailux.ae', business_name: 'Dubai Luxury Motors', country: 'UAE', country_code: 'AE', plan: 'scale', revenue: 499, currency: 'AED ', total_calls: 1200, total_minutes: 1800 },
    { id: '8', email: 'neha@edulearn.in', business_name: 'EduLearn Academy', country: 'India', country_code: 'IN', plan: 'growth', revenue: 3999, currency: '₹', total_calls: 2100, total_minutes: 3500 },
    { id: '9', email: 'james@nyfinance.com', business_name: 'NY Finance Group', country: 'USA', country_code: 'US', plan: 'growth', revenue: 79, currency: '$', total_calls: 1800, total_minutes: 2900 },
    { id: '10', email: 'fatima@abudhabi.ae', business_name: 'Abu Dhabi Insurance', country: 'UAE', country_code: 'AE', plan: 'growth', revenue: 299, currency: 'AED ', total_calls: 900, total_minutes: 1400 },
  ],
};

export type AdminMetrics = typeof mockMetrics;
