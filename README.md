# Circadian Blinds JSON API

এই Express API ThingSpeak channel-এর data JSON-এ দেয়। Wake-up time ও blind/system status-এর POST request ThingSpeak-এ সংরক্ষণ করে। Channel-এর Field 4-এ blind status এবং Field 5-এ wake-up time লেখা হয়।

## চালু করার নিয়ম

1. Node.js 18 বা নতুন সংস্করণ ইনস্টল করুন।
2. এই ফোল্ডারে terminal খুলে `npm install` চালান।
3. `.env.example` কপি করে `.env` নাম দিন।
4. `.env`-এ ThingSpeak Channel ID, Read API Key, এবং Write API Key বসান। Public channel হলে Read API Key খালি রাখা যায়; POST endpoint চালাতে Write API Key লাগবে।
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

`GET /api/settings` — ThingSpeak-এর সর্বশেষ Field 4 ও Field 5 থেকে status এবং wake-up time ফেরত দেয়।

## সীমাবদ্ধতা

ThingSpeak-এর free plan-এ channel update-এর মাঝে নির্দিষ্ট বিরতি লাগে। খুব দ্রুত পরপর POST করলে ThingSpeak update গ্রহণ নাও করতে পারে। Arduino Uno sketch নিজে Wi‑Fi দিয়ে এই API-তে যুক্ত নয়।

