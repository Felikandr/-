# Склад картриджей

Общий учёт картриджей: все пользователи видят одни и те же данные (обновляются раз в 5 секунд).

## Вариант 1. Локально (проще всего)
Нужен Node.js 18+.

    node server.js

Откройте http://localhost:8080 (с других компьютеров в сети — адрес, который напечатает сервер).
Данные хранятся в `data.json`. Пароль (необязательно): `PASSWORD=секрет node server.js`

## Вариант 2. Vercel + Supabase (доступ из интернета)
1. Supabase → SQL Editor → выполнить содержимое `supabase.sql`.
2. Supabase → Project Settings → API: скопировать Project URL и secret (service_role) key.
3. Залить проект на GitHub, импортировать в Vercel.
4. Vercel → Settings → Environment Variables:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SECRET_KEY` = secret / service_role ключ
5. Redeploy.

Внимание: в варианте 2 нет пароля — любой, у кого есть ссылка, может менять данные.

Если открыть `index.html` двойным щелчком, всё работает, но данные хранятся только в этом браузере.
