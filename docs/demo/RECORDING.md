# Memoria demo video — Screen Studio runbook

Target length: **~2 minutes**. Records the web build in a phone-sized browser window.

## 1. Set up (once)

```bash
# backend/.env  (copy from .env.example)
SECRET_KEY=<any long random string>
GEMINI_API_KEY=<your key>
DATABASE_URL=sqlite:///demo.db        # keeps demo data separate from your dev DB

# seed the demo account + a week of memories + forum posts
cd backend
python ../docs/demo/seed_demo.py --photos ~/Pictures/memoria-demo   # --photos optional
python run.py
```

```bash
cd frontend
echo "EXPO_PUBLIC_API_URL=http://localhost:5001" > .env
npx expo start --web
```

**Photos:** put 9 real photos in a folder (sorted by filename). They're paired, in order, with:
latte on a café table · purple garden flowers · older man in a café · black puppy · couple on a seaside bench · harbor sailboats · yogurt with strawberries · cookies & yellow flowers · strawberries at a market.
Without `--photos` you get coloured placeholders, which work for a rehearsal but not for the final video.
Re-run the seed before each take for a clean state (it wipes `demo.db`).

**Login:** `demo@memoria.app` / `memoria-demo`

## 2. Screen Studio settings

- Record a **single window**: Chrome, with DevTools device toolbar set to iPhone 14 Pro (393×852) and DevTools undocked, or just resize the window to roughly phone width.
- Background: soft gradient wallpaper, padding ~10%, rounded corners + shadow.
- Auto-zoom **on**, cursor size large, "hide cursor when idle" on, click sound off.
- Output 1080p / 60fps. Record voiceover separately or live with a mic.
- Before recording: log in once so the browser remembers it? **No.** Start logged out, because the welcome screen is a good opener.

## 3. Shot list + voiceover

| # | Time | On screen | Voiceover |
|---|---|---|---|
| 1 | 0:00 | Welcome screen. Hover over the three feature rows. | "More than 55 million people live with dementia. One of the hardest parts is forgetting what happened today, or yesterday. Memoria turns your phone into an external memory." |
| 2 | 0:12 | Tap **I already have an account** → log in. | "It's built for older adults: large text, high contrast, big buttons, and one clear action on every screen." |
| 3 | 0:22 | **Today** tab showing today's 2 photos with captions. | "Throughout the day you take photos. An AI model, Salesforce BLIP, describes each one automatically and files it under that day." |
| 3b | (optional) | Tap **Choose a photo** and upload one. *Needs BLIP installed; the first upload is slow, so warm it up before recording.* | "Just pick a photo, and Memoria writes the caption for you." |
| 4 | 0:35 | **Memories** tab → calendar with marked days. Tap yesterday → 3 photos. Open one → Share / Delete buttons. | "Every day with photos is marked on a calendar. Tap any day to look back, then share a memory with family." |
| 5 | 0:50 | **Ask** tab. Tap the suggestion **What did I do yesterday?** Wait for the reply. Then type **"What did I do last Thursday?"** | "And the heart of Memoria: just ask. Gemini works out which day you mean, whether that's yesterday, last Thursday or March 3rd, and retells it in short, warm sentences built *only* from your own photos. It never makes things up." |
| 6 | 1:15 | **Forum** tab → open "Just started using Memoria with my mom" → show reply. | "A community space lets families and caregivers share tips and support." |
| 7 | 1:28 | **Learn** tab → open the memory self-check briefly, then the card-matching memory game, and flip two cards. | "There's plain-language information about Alzheimer's, a memory self-check, and a memory game for gentle practice." |
| 8 | 1:42 | Back to **Today**. Hold for a moment. | "Plus a gentle 7 PM reminder, and a nudge when you visit somewhere new. All AI runs on the server, every photo is private to its owner, and location data is stripped from images. Memoria: helping people hold on to their days." |
| 9 | 1:55 | End card: logo + GitHub URL (add in Screen Studio or your editor). | — |

Day offsets in the seed: today (2), yesterday (3), 2 days ago (1), 4 days ago (2), 6 days ago (1).
For shot 5's second question, pick a weekday that falls on **4 days ago** (breakfast and cookies) so the answer is a nice one.

## 4. Tips

- Do one full dry run first: it warms up Gemini and catches any API errors.
- Pause about 1s after each tap, so Screen Studio's auto-zoom has time to land.
- If a Gemini reply is slow, cut the wait in Screen Studio's timeline.
