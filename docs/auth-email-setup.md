# Meta — Auth Email / SMTP setup

## Состояние на 30 октября 2026 года

- Сайт: `https://amirmurat.github.io/meta/`; репозиторий: `amirmurat/meta`.
- Supabase project: `munmvexfrtqwmwptafkf` (Meta).
- Подтверждено в Auth logs: ошибки `429: email rate limit exceeded` при `/recover`; слишком частые запросы `/signup`; переходы по старым/недействительным ссылкам `/verify`.
- Сервер Supabase исправен (`ACTIVE_HEALTHY`). Ограничение встроенного Supabase SMTP — **2 письма в час** и отправка лишь на адреса участников Supabase-команды. Это не сервис для настоящих пользователей.
- **Настройка внешнего SMTP пока НЕ выполнена.** Исправления UI в `account.html` не снимают лимитов сервера.

## Временный бесплатный SMTP без домена — Gmail

Это вариант **только для закрытого пилота/тестирования**, не гарантированная production-доставка. Лучше создать отдельный Gmail для Meta, не использовать личный основной ящик.

1. Войдите в этот Gmail и включите двухэтапную проверку: https://myaccount.google.com/security
2. Если Google позволяет, создайте **App Password**: https://myaccount.google.com/apppasswords. Он может быть недоступен для некоторых типов и настроек аккаунта.
3. В Supabase откройте **Authentication → Emails → SMTP Settings**:
   https://supabase.com/dashboard/project/munmvexfrtqwmwptafkf/auth/smtp
4. Включите **Custom SMTP** и введите:
   - Sender email: **полный адрес отдельного Gmail**
   - Sender name: `Meta`
   - Host: `smtp.gmail.com`
   - Port: `465` (альтернатива: `587`)
   - Username: **тот же Gmail**
   - Password: **App Password**, НЕ обычный пароль аккаунта.
5. Сохраните настройки. **Никогда не помещайте App Password в GitHub, клиентский JavaScript, документы Drive или чат.** Вводите его только в защищённые настройки Supabase. Не отключайте подтверждение адреса электронной почты.
6. Проверьте **Authentication → URL Configuration**: `Site URL` — `https://amirmurat.github.io/meta/`; в Redirect URLs должен присутствовать `https://amirmurat.github.io/meta/account.html`. Прежде чем менять URL, проверьте действующие значения.
7. Проверьте **Authentication → Rate Limits**: после подключения SMTP лимит Supabase по умолчанию — 30 писем/час; отдельное ограничение действует на повторные запросы одному пользователю. Увеличивайте лимиты осознанно, без отключения защиты от злоупотреблений.
8. Протестируйте на **контролируемом втором email-адресе**, отличном от отправителя: регистрация → подтверждение → вход → восстановление пароля → новая ссылка. В случае ошибки смотрите Auth logs в Supabase и папку «Отправленные» в Gmail. Не запускайте массовые тестовые письма.

Ограничения: у бесплатного Gmail есть антиспам-политики и дневной порог (Google указывает ошибки после более 500 писем/сутки), возможны блокировки/задержки и проблемы с репутацией. **100 зарегистрированных пользователей не равны 100 письмам одновременно**: каждое подтверждение/восстановление/изменение email тратит отдельную квоту. Не обещайте пилоту безотказную доставку через личный Gmail.

## Переход на production

Когда появится бюджет на домен, подключить специализированный SMTP (например, Brevo или Resend) с проверенным доменом отправителя, SPF, DKIM и DMARC; установить разумные email rate limits, CAPTCHA и мониторинг отправки. Brevo на бесплатном тарифе предлагает до 300 отправок/день, но для надёжной отправки нужна аутентификация собственного домена и активация транзакционной почты.

Идея альтернативы без SMTP — Google OAuth — устраняет письма для входа через Google, но требует отдельной настройки в Google Cloud и Supabase; **не** заменяет восстановление пароля для существующих email/password пользователей.

## Источники

- Supabase Custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase Google SMTP: https://supabase.com/kb/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y
- Google App Passwords: https://support.google.com/accounts/answer/185833
- Gmail sending limits: https://support.google.com/mail/answer/22839
- Brevo/Supabase: https://developers.brevo.com/docs/supabase-smtp-integration
