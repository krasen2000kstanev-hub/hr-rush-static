# HR:RUSH FOR PRACTICE — Applications API

Минимален Cloudflare Worker + D1 backend за формата за кандидатстване на
публичния сайт. Направен по същия модел като `sofiasummit-events-api`.

## Стартиране

1. Инсталирай Wrangler (ако още нямаш): `npm install -g wrangler`
2. Влез в Cloudflare (отваря браузър, никакви токени в терминала): `wrangler login`
3. Създай D1 база:
   ```
   wrangler d1 create hr-rush-for-practice
   ```
   Копирай отпечатания `database_id` в `wrangler.toml`.
4. Приложи схемата към базата:
   ```
   wrangler d1 execute hr-rush-for-practice --remote --file=./schema.sql
   ```
5. Деплойни Worker-а:
   ```
   wrangler deploy
   ```
   Ще отпечата адрес като `https://hr-rush-for-practice-api.<твоя-subdomain>.workers.dev` —
   постави го в `SITE_CONFIG.apiBaseUrl` в `index.html` на публичния сайт.
6. Провери здравето на API-то:
   ```
   curl https://hr-rush-for-practice-api.<твоя-subdomain>.workers.dev/api/health
   ```
   Очакван отговор: `{"status":"ok"}`

## Endpoints

- `GET /api/health` — health check.
- `POST /api/apply` — приема `{firstName, lastName, university, specialty, phone, email}`,
  валидира и записва ред в D1 таблицата `applications`. Връща `{success, id}` при успех,
  `{success:false, errors:[...]}` при невалидни данни.

## Backend статус

Работи: health endpoint, приемане и валидация на кандидатури, запис в D1.

Не е завършено (следващи стъпки, когато потрябват): преглед/качване на CV файлове
(ще изисква Cloudflare R2), admin панел за преглед на кандидатурите, автоматични
потвърждаващи имейли (ще изисква Resend API key).

Не записвай Cloudflare токени или други секрети в repository-то — `wrangler login`
върши автентикацията през браузъра, без токен в кода.

## Тестове

```
npm install --save-dev vitest
npx vitest run
```
