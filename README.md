# Circadian Blinds JSON API

ছবির নির্দেশনা অনুযায়ী এই Express API ThingSpeak channel data JSON-এ দেয় এবং wake-up time ও blind/system status নেওয়ার POST endpoint রাখে।

## চালু করার নিয়ম

1. Node.js 18 বা নতুন সংস্করণ ইনস্টল করুন।
2. এই ফোল্ডারে terminal খুলে `npm install` চালান।
3. `.env.example` কপি করে `.env` নাম দিন।
4. `.env`-এ ThingSpeak Channel ID এবং Read API Key বসান। Public channel হলে Read API Key খালি রাখা যায়।
5. `npm start` চালান। API চলবে `http://localhost:3000`-এ।

## Endpoints

### ThingSpeak data

`GET /api/data` — channel-এর metadata ও সর্বশেষ 8000 feed JSON হিসেবে ফেরত দেয়।

### Wake-up time

`POST /api/wakeup-time`

```json
{"time":"07:00"}
```

সময় 24-hour `HH:MM` format-এ দিতে হবে।

### Blind/system status

`POST /api/status`

```json
{"status":"open"}
```

সমর্থিত status: `open`, `closed`, `automatic`, `system_on`।

### বর্তমান API settings দেখা

`GET /api/settings` — বর্তমানে রাখা wake-up time ও status ফেরত দেয়।

## সীমাবদ্ধতা

Wake-up time ও status আপাতত সার্ভারের memory-তে রাখা হয়; সার্ভার restart হলে সেগুলো default-এ ফিরে যায়। এই API data ThingSpeak থেকে পড়ে। Arduino Uno sketch নিজে ThingSpeak-এ data পাঠায় না, আর এই API-তে POST করা setting Uno-তে পাঠানোর সংযোগও এখনো নেই।

