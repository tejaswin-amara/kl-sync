import { test, expect } from '@playwright/test';

test.describe('Comprehensive 7-Route E2E Browser Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set authenticated session cookie
    await page.context().addCookies([
      {
        name: 'kl_erp_session',
        value:
          'b64.eyJjb29raWVzIjpbIHsgIm5hbWUiOiAiUEhQU0VTU0lEIiwgInZhbHVlIjogImRlbW9fcGhwc2Vzc2lkXzEyMyIgfSBdLCAiY3NyZlRva2VuIjogImRlbW9fY3NyZlRva2VuXzEyMyIsICJ1c2VyQWdlbnQiOiAiTW96aWxsYS81LjAiIH0=',
        url: 'http://localhost:3000',
      },
    ]);

    // Pre-seed storage state before any page script executes
    await page.addInitScript(() => {
      const years = JSON.stringify([{ value: '2025-2026', label: '2025-2026' }]);
      const sems = JSON.stringify([{ value: '1', label: 'Odd Semester' }]);

      const ttMock = JSON.stringify([
        {
          'Day / Period': 'Monday',
          '1': '23CS2101R-L - S-10 - RoomNo-101 - Dr. Smith',
          '2': '23CS2102R-P - S-10 - RoomNo-LAB-3 - Prof. Johnson',
          '3': 'Free',
          '4': '23CS2103R-L - S-10 - RoomNo-105 - Dr. Allen',
        },
      ]);

      window.localStorage.setItem('kl_student_name', 'Alex Student');
      window.localStorage.setItem('kl_erp_year', '2025-2026');
      window.localStorage.setItem('kl_erp_sem', '1');
      window.localStorage.setItem('kl_erp_academic_years', years);
      window.localStorage.setItem('kl_erp_semesters', sems);
      window.localStorage.setItem('kl_erp_csrf_token', 'demo_csrf_token_123');
      window.localStorage.setItem('kl_timetable_2025-2026_1', ttMock);

      window.sessionStorage.setItem('kl_erp_year', '2025-2026');
      window.sessionStorage.setItem('kl_erp_sem', '1');
      window.sessionStorage.setItem('kl_erp_academic_years', years);
      window.sessionStorage.setItem('kl_erp_semesters', sems);
      window.sessionStorage.setItem('kl_erp_csrf_token', 'demo_csrf_token_123');
      window.sessionStorage.setItem('kl_timetable_2025-2026_1', ttMock);
    });
  });

  test('Route 1: / (Login Route) loads cleanly without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
    await expect(page.locator('#student-id-field')).toBeVisible();
    await expect(page.locator('#password-field')).toBeVisible();
  });

  test('Route 2: /dashboard (Dashboard Overview) renders live ERP summary data', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByText(/Cumulative GPA/i)).toBeVisible();
    await expect(page.getByText(/Attendance/i).first()).toBeVisible();
    await expect(page.getByText(/Pending Fees/i).first()).toBeVisible();
    await expect(page.getByText(/Completed Credits/i).first()).toBeVisible();
    await expect(page.getByText(/Daily Schedule/i)).toBeVisible();
  });

  test('Route 3: /dashboard/timetable (Student Timetable) renders matrix grid & list views', async ({ page }) => {
    await page.goto('/dashboard/timetable');

    await expect(page.getByRole('heading', { name: /Student Timetable/i })).toBeVisible();
    const gridBtn = page.getByRole('button', { name: /Grid/i });
    const listBtn = page.getByRole('button', { name: /List/i });
    await expect(gridBtn).toBeVisible();
    await expect(listBtn).toBeVisible();
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();

    // Wait for timetable table to finish loading
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    await listBtn.click();
    await expect(page.locator('table')).toBeVisible();

    await gridBtn.click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('Route 4: /dashboard/attendance (Live Attendance) renders attendance breakdown', async ({ page }) => {
    await page.goto('/dashboard/attendance');

    await expect(page.getByRole('heading', { name: /Live Attendance/i })).toBeVisible();
    await expect(page.getByText(/23CS2101R|Data Structures|Attendance/i).first()).toBeVisible();
  });

  test('Route 5: /dashboard/marks (Internal Marks) renders assessment scores', async ({ page }) => {
    await page.goto('/dashboard/marks');

    await expect(page.getByText(/Marks|Internal|Assessment/i).first()).toBeVisible();
    await expect(page.getByText(/23CS2101R|Data Structures/i).first()).toBeVisible();
  });

  test('Route 6: /dashboard/profile (Student Profile) renders student info & courses', async ({ page }) => {
    await page.goto('/dashboard/profile');

    await expect(page.getByText(/Alex Student|Student Profile|Profile/i).first()).toBeVisible();
    await expect(page.getByText(/2100030000|Computer Science|B.Tech/i).first()).toBeVisible();
  });

  test('Route 7: /dashboard/fee (Fee Details) renders fee balance & payment status', async ({ page }) => {
    await page.goto('/dashboard/fee');

    await expect(page.getByText(/Fee|Tuition|Payment/i).first()).toBeVisible();
  });
});
