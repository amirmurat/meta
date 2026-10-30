// Keep redirects inside this GitHub Pages application, including custom domains.
export function safeDestination(raw, currentHref) {
  const base = new URL('./', currentHref);
  if (!raw || /[\\\u0000-\u0020]/.test(raw) || raw.startsWith('//')) return base.href;
  try {
    const target = new URL(raw, base);
    const page = target.pathname.slice(base.pathname.length);
    const allowed = /^(?:index|courses|profile|support|statistics|about|ielts|flutter|quran|ielts-lesson|flutter-lesson|assessment|ielts-dashboard|reading-mock|writing-mock|listening-practice|admin-statistics|admin-operations)\.html$/;
    if (target.origin === base.origin && !target.username && !target.password &&
        target.pathname.startsWith(base.pathname) && (page === '' || allowed.test(page))) return target.href;
  } catch {}
  return base.href;
}

export function completionRequirements({signedIn, answer, criteria, aiReviewed, selfPassed}, en = false) {
  const missing = [];
  if (!signedIn) missing.push(en ? 'Sign in' : 'Войди в аккаунт');
  if (!answer.trim()) missing.push(en ? 'Write your answer' : 'Напиши свой ответ');
  if (!criteria.every(Boolean)) missing.push(en ? 'Open the criteria and check every item' : 'Открой критерии и проверь каждый пункт');
  if (!aiReviewed) missing.push(en ? 'Review with AI and confirm it below' : 'Проверь ответ с ИИ и подтверди это ниже');
  if (!selfPassed) missing.push(en ? 'Confirm that your work meets the criteria' : 'Подтверди соответствие работы критериям');
  return missing;
}
