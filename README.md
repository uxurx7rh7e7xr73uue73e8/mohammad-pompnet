# PompNet — Ultra Neon Premium

این پروژه در فهرست پروژه‌های GitHub شما قرار دارد و آخرین نسخه‌ی رابط کاربری Ultra Neon Premium روی branch `main` ثبت شده است.

## اجرای سریع

```bash
git clone https://github.com/uxurx7rh7e7xr73uue73e8/mohammad-pompnet.git
cd mohammad-pompnet
cp .env.example .env
docker compose up --build
```

آدرس محلی: `http://localhost:8080`

در Railway، برنامه روی `0.0.0.0` گوش می‌دهد و پورت را از متغیر runtime یعنی `$PORT` می‌گیرد. پورت ۸۰۸۰ فقط مقدار پیش‌فرض اجرای محلی است؛ دامنه‌ی عمومی Railway را از بخش **Generate Domain** دریافت کنید.

## ظاهر جدید

- هویت کامل محمد پمپ نت / PompNet
- رابط فارسی RTL با تم مشکی، آبی نئون و بنفش نئون
- کارت‌ها و دکمه‌های glassmorphism با glow و hover
- واکنش‌گرا برای موبایل و دسکتاپ
- وضعیت زنده‌ی سرور، جست‌وجوی کاربر و نمایش Inbound
- صدای ظریف تعامل برای دکمه‌ها، با fallback بی‌صدا در مرورگرهای محدود
- متن معرفی بالای پنل: «کدنویسی شده توسط تیم پمپ نت»

## نکته‌ی داده و امنیت

این رابط، جایگزین داده‌ی واقعی یا تنظیمات Xray نیست. قبل از اتصال به نصب موجود Sanaei/3x-ui بکاپ بگیرید، دیتابیس را reset نکنید و عملیات privileged Xray را فقط از طریق VPS Agent احراز هویت‌شده انجام دهید. رازها را در `.env` یا Railway Variables قرار دهید و هرگز در GitHub commit نکنید.
