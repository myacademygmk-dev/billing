import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UX_BASE_URL || 'http://localhost:3000';
const output = new URL('../../reports/ux-review/', import.meta.url);
await mkdir(output, { recursive: true });
const target = await (await fetch('http://localhost:9223/json/new?about:blank', { method: 'PUT' })).json();
if (!target) throw new Error('No headless browser tab');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 45000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
const student = { id: '11111111-1111-4111-8111-111111111111', name: 'Ananya Kumar', student_code: 'S001', class_name: '10', status: 'active', school_name: 'City Higher Secondary School', father_name: 'Ravi Kumar', mother_name: 'Priya Kumar', parent_phone: '9000000000', joined_date: '2025-06-01', pending: '1500', expected_fee: '500', paid_total: '4500' };
const year = { id: 'year-1', name: '2026-2027', start_date: '2026-06-01', end_date: '2027-05-31', is_current: true };
const months = Array.from({ length: 12 }, (_, i) => { const date = new Date(Date.UTC(2026, 5 + i, 1)); return { month: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }), is_paid: i < 3 }; });
function fixture(url) {
  const path = new URL(url).pathname.replace('/api/backend', '');
  if (path === '/auth/me') return { username: 'Preview Admin', role: 'admin', permissions: [] };
  if (path === '/academic/years') return [year];
  if (path === '/academic/classes') return [{ id: 'class-1', class_name: '10', section: 'A', subjects: [{ id: 'subject-1', name: 'Mathematics', code: 'MATH', max_marks: 100 }, { id: 'subject-2', name: 'Science', max_marks: 100 }] }];
  if (path === '/students/classes') return ['10', '11', '12'];
  if (path.endsWith('/billing-overview')) return { student_id: student.id, monthly_fee: '500', payable_amount: '1000', cycle_months: 2, cycle_label: 'September - October', months, pending_months: months.filter(month => !month.is_paid), next_unpaid_label: 'Sep 2026', batch_start_label: 'Jun 2026', batch_end_label: 'May 2027' };
  if (path.endsWith('/fee')) return { student_id: student.id, expected_fee_amount: '500' };
  if (path.endsWith('/balance')) return { ...student, student_id: student.id };
  if (path === `/students/${student.id}`) return student;
  if (path === '/payments') return { items: [{ id: 'payment-1', receipt_no: 'REC-001', paid_at: '2026-08-05T10:00:00Z', mode: 'cash', amount: '500', fee_period_label: 'Aug 2026', notes: 'Tuition payment' }], total: 1 };
  if (path === '/students/statistics') return { total_students: 80, active_students: 75, new_admissions: 5, students_with_dues: 12 };
  if (path === '/students' || path === '/students/balances') return { items: Array.from({ length: 25 }, (_, i) => ({ ...student, id: i === 0 ? student.id : `student-${i}`, student_code: `S${String(i + 1).padStart(3, '0')}`, name: i === 0 ? student.name : `Student ${i + 1}` })), total: 80 };
  if (path === '/savings/balances') return { items: [{ student_id: student.id, student_code: student.student_code, student_name: student.name, total_savings: '2500' }], total: 1 };
  if (path === '/savings') return { items: [{ id: 'saving-1', student_id: student.id, student_name: student.name, student_code: student.student_code, amount: '500', mode: 'cash', recorded_at: '2026-09-08T10:00:00Z', created_by_name: 'Admin', notes: 'Monthly deposit' }], total: 1 };
  if (path === '/fees/structures') return [{ id: 'fee-1', name: 'Tuition', amount: '500', class_name: '10', academic_year: year.name, is_recurring: true, is_active: true }];
  if (path === '/fees/discounts') return [{ id: 'discount-1', name: 'Sibling concession', discount_type: 'percentage', value: '10', is_active: true }];
  if (path === '/reports/summary') return { paid_students: 68, unpaid_students: 12, month_total: '34000', today_total: '2500' };
  if (path === '/reports/annual') return { monthly_breakdown: ['Jun', 'Jul', 'Aug', 'Sep'].map((name, i) => ({ month: i + 6, month_name: name, total: String(20000 + i * 5000), payment_count: 40 + i * 10 })), mode_breakdown: [{ mode: 'cash', total: '30000', payment_count: 60 }, { mode: 'upi', total: '45000', payment_count: 90 }] };
  if (path === '/reports/monthly-students') return [];
  if (path === '/attendance/students') return { total: 1, marked: 0, items: [{ student_id: student.id, student_name: student.name, student_code: student.student_code, class_name: '10', status: 'not_marked' }] };
  if (path === '/attendance/staff/clock-records') return [{ staff_id: 'staff-1', staff_name: 'Priya Raman', staff_code: 'T001', clock_in: null, clock_out: null, total_hours: null, status: 'not_clocked_in' }];
  if (path === '/attendance/staff/clock-analytics') return [];
  if (path === '/staff') return { items: [{ id: 'staff-1', name: 'Priya Raman', staff_code: 'T001', role: 'teacher', monthly_salary: '20000', is_active: true }], total: 1 };
  if (path === '/exams') return { items: [{ id: 'exam-1', name: 'Quarterly examination', exam_type: 'quarterly', start_date: '2026-09-15' }], total: 1 };
  if (path === '/exams/marks') return { items: [], total: 0 };
  if (path.includes('website') || path.includes('settings')) return {};
  if (path.includes('public/')) return {};
  return { items: [], total: 0 };
}
const errors = [];
socket.onmessage = async ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const task = pending.get(message.id);
    if (!task) return;
    clearTimeout(task.timer); pending.delete(message.id);
    if (message.error) task.reject(new Error(JSON.stringify(message.error))); else task.resolve(message.result);
  } else if (message.method === 'Fetch.requestPaused') {
    const { requestId, request } = message.params;
    try { await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(fixture(request.url))).toString('base64') }); }
    catch (error) { errors.push(String(error)); }
  } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description ?? ''));
};
await send('Page.enable');
await send('Runtime.enable');
await send('Runtime.discardConsoleEntries');
errors.length = 0;
await send('Network.enable');
await send('Network.setCookie', { name: 'access_token', value: 'isolated-visual-check', url: base });
await send('Fetch.enable', { patterns: [{ urlPattern: '*api/backend*' }] });
async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function pause(ms = 500) { await new Promise((resolve) => setTimeout(resolve, ms)); }
async function waitFor(expression) {
  for (let attempt = 0; attempt < 80; attempt++) { if (await evaluate(expression)) return; await pause(); }
  console.log(await evaluate('document.body.innerText'), errors);
  throw new Error(`Page not ready: ${expression}`);
}
async function click(text) { await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === ${JSON.stringify(text)}); if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)}); button.click(); })()`); await pause(); }
const checks = [];
async function capture(name, width) {
  await pause();
  const dimensions = await evaluate(`({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, heading: document.querySelector('h1')?.textContent, bodyText: document.body.innerText.slice(-150) })`);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(new URL(`${name}-${width}.png`, output), Buffer.from(screenshot.data, 'base64'));
  checks.push({ name, ...dimensions, overflow: dimensions.scrollWidth > dimensions.width });
}
try {
  for (const width of (process.argv[2] === 'students' ? [1440, 1366, 390] : [1440, 390])) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: width === 390 ? 844 : width === 1366 ? 768 : 1000, deviceScaleFactor: 1, mobile: false });
    for (const [name, path] of [['dashboard', '/dashboard'], ['profile', `/students/${student.id}`], ['savings', '/savings'], ['payments', `/collect?student_id=${student.id}`], ['academic', '/academic'], ['fees', '/fees'], ['students', '/students'], ['reports', '/reports'], ['staff', '/staff'], ['cms', '/cms'], ['settings', '/settings'], ['enquiries', '/enquiries']]) {
      if (process.argv[2] && name !== process.argv[2]) continue;
      await send('Page.navigate', { url: base + path });
      await waitFor("!!document.querySelector('main h1') && !!document.querySelector('aside a[href=\"/settings\"]')");
      await pause(1100);
      await capture(name, width);
      if (name === 'academic') {
        await click('Exams & Marks'); await click('Quarterly examinationquarterly2026-09-15').catch(async () => {
          await evaluate("[...document.querySelectorAll('button')].find(item => item.textContent.includes('Quarterly examination'))?.click()");
        });
        await pause(600); await click('Enter class marks'); await capture('class-marks-dialog', width);
      }
      if (name === 'profile') {
        if (width >= 1280) {
          const aligned = await evaluate(`(() => { const identity = document.querySelector('[aria-label="Student identity"]').getBoundingClientRect(); const tabs = document.querySelector('[aria-label="Student profile sections"]').getBoundingClientRect(); return Math.abs(identity.top - tabs.top) < 2 && identity.left > tabs.right; })()`);
          if (!aligned) throw new Error('Student identity must sit to the right of tabs on the same row');
        }
        await click('Family & contact'); await capture('profile-family', width);
        await click('Enrollment'); await capture('profile-enrollment', width);
        await click('Mark inactive'); await capture('profile-status-dialog', width);
      }
      if (name === 'students') {
        const visibleRows = await evaluate(`Array.from(document.querySelectorAll('tbody tr')).filter(row => { const r = row.getBoundingClientRect(); const region = row.closest('[aria-label="Student records"]').getBoundingClientRect(); return r.top >= region.top && r.bottom <= Math.min(region.bottom, innerHeight); }).length`);
        console.log(JSON.stringify({ width, visibleRows }));
        if (width >= 1024 && visibleRows < 12) throw new Error('Student table displays fewer than 12 rows');
        await click('Attendance'); await capture('student-attendance', width);
      }
      if (name === 'staff') { await click('Attendance'); await capture('staff-attendance', width); }
      if (name === 'reports') {
        await click('Review unpaid students'); await capture('reports-students', width);
        await click('Transactions'); await capture('reports-transactions', width);
        await click('Expenses'); await capture('reports-expenses', width);
        await click('Savings'); await capture('reports-savings', width);
      }
      if (name === 'cms') {
        await evaluate("[...document.querySelectorAll('button')].find(item => item.textContent.includes('Website Settings'))?.click()");
        await pause(700); await capture('website-settings', width);
      }
    }
  }
  console.log(JSON.stringify({ screens: checks.length, overflow: checks.filter(item => item.overflow), errors }, null, 2));
  await writeFile(new URL('checks.json', output), JSON.stringify({ checks, errors }, null, 2));
} finally {
  await send('Network.deleteCookies', { name: 'access_token', url: base });
  await send('Fetch.disable');
  socket.close();
  await fetch(`http://localhost:9223/json/close/${target.id}`);
}
