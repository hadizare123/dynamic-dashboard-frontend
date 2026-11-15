const BASE_URL = 'http://127.0.0.1:8000'



export async function fetchDashboard(dashboardId) {
  try {
    const response = await fetch(`${BASE_URL}/dashboards/${dashboardId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // اگر از سشن استفاده می‌کنی برای ارسال کوکی لاگین:
      credentials: 'include' 
    });

    if (!response.ok) {
      throw new Error(`خطا در ارتباط با سرور: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
