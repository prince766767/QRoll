# QRoll launcher — home-screen icon fix

**One link. Every teacher. No setup on your end per person.**

Your colleagues never see GitHub, never install anything, never edit a file.
They open one normal-looking web link, tap *Add to Home screen*, and QRoll
appears with the proper logo, straight into the shared console. That's the
whole experience on their side.

---

## Why it's needed

Adding the Apps Script `/exec` link straight to a phone's home screen gives you
a generic Google **"G"**, never the QRoll logo. Two independent causes:

1. **Apps Script renders your page inside an iframe.** Your web app lives in a
   frame on `script.google.com`. When a phone builds a home-screen shortcut it
   reads the icon and manifest from the **top-level** document — Google's, not
   yours. The `<link rel="icon">` tags in `Teacher.html` are never looked at.
   `setFaviconUrl()` only influences the browser tab. Open request since 2013
   ([issuetracker 36756649](https://issuetracker.google.com/issues/36756649)).

2. **The old icon URL is dead anyway.** `setupLogoIcon()` stored a
   `drive.google.com/thumbnail?id=…` link, and Google has been progressively
   blocking Drive image hotlinking since early 2024 — it fails hardest on
   mobile.

No setting inside Apps Script fixes this. It needs one real web page that isn't
Google's, carrying a real manifest. That's this folder.

---

## One link for the whole department

QRoll is now a centrally maintained app: there is exactly **one** teacher
console, at one `/exec` URL. Google Sign-In plus each teacher's own workspace
is what tells them apart — not which link they opened. So this launcher hard-
codes that single URL (`DEFAULT_URL` in `index.html`) and hands every visitor
straight to it. There is nothing to personalize per teacher and nothing for
you to generate or send them individually — the same link works for everyone.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | The launcher every teacher opens. `DEFAULT_URL` points at the shared teacher console. |
| `manifest.json` | App name, colours, icons |
| `sw.js` | Tiny service worker so Chrome treats this as an installable app, not a bookmark |
| `qroll-icon-192.png`, `qroll-icon-512.png` | Standard icons |
| `qroll-icon-maskable-192.png`, `qroll-icon-maskable-512.png` | Padded versions so Android's circular crop doesn't slice off the "QRoll" wordmark |

---

## Part 1 — publish it (you, once, ~5 minutes)

Your repo — <https://github.com/prince766767/QRoll> — already exists and is
public, but it's **empty**. That matters: GitHub Pages won't offer a branch to
publish until the repo has at least one commit. So upload first, switch Pages on
second.

### Step 1 — upload the files

1. Open <https://github.com/prince766767/QRoll>.
2. On the empty-repo screen, find the line *"…or upload an existing file"* and
   click **uploading an existing file**.
   (If the repo already has files, use **Add file → Upload files** instead.)
3. Open the `qroll-launcher` folder on your computer, select the files listed
   above (the README comes along harmlessly — GitHub just shows it on the
   repo page), and drag them into the browser window.

   Drag the **files**, not the folder. If you drop the folder itself, everything
   lands one level deep and the address gains an extra `/qroll-launcher/`.

4. Scroll down, click **Commit changes**.

You should now see the files listed at the top level of the repo, with
`index.html` among them.

### Step 2 — turn Pages on

1. Click **Settings** (top of the repo, gear icon).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - **Source:** *Deploy from a branch*
   - **Branch:** `main`, folder `/ (root)`
4. Click **Save**.

### Step 3 — wait, then open it

Give it 1–2 minutes (first publish is the slow one). Refresh the Pages settings
screen and a green banner appears with your live address:

```
https://prince766767.github.io/QRoll/
```

Note the **capital Q and R** — the path copies your repo name exactly, and it is
case-sensitive. `…/qroll/` will 404.

That's it. You never touch GitHub again unless you want to change the design
or push a new `DEFAULT_URL` (only needed if a brand-new deployment ever issues
a new `/exec` URL — see "Keeping it in sync" below).

### Optional — keep the Apps Script source here too

Nothing stops you storing `Code.gs`, `Teacher.html`, `Scan.html` and the rest in
this same repo — Pages just serves files, and a `.gs` file nobody requests is
harmless. Put them in a subfolder (say `apps-script/`) so they don't clutter the
root alongside the launcher.

Safe to make public: the console PIN and the QR signing secret both live in
Script Properties, generated at runtime. Neither is in the source.

---

## Part 2 — give this to your colleagues (30 seconds, once, for everyone)

Just send the one link:

```
https://prince766767.github.io/QRoll/
```

That's the entire distribution step. Every teacher gets the same message,
there's nothing to look up or paste per person.

---

## Part 3 — what your colleague does

1. Open the link on their phone.
2. **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**.
   **iPhone (must be Safari, not Chrome):** **Share** → **Add to Home Screen**.
3. Done. The QRoll icon opens the console, where they sign in with their own
   Google account.

If they'd previously added the old per-Sheet `/exec` shortcut from before
centralization, they should **delete it first** — phones cache shortcut icons
and won't refresh one in place.

---

## Troubleshooting

**Still seeing "G" or a blank square**
Delete the old shortcut, clear site data for the `github.io` page
(**⋮ → Settings → Site settings**), and add it again.

**"Add to Home screen" doesn't offer to install**
Open the page in desktop Chrome, press **F12 → Application → Manifest**; it
lists any missing field. Usual cause is a 404 on `manifest.json` because files
went into a subfolder — all paths are relative, so everything must sit side by
side.

**Icons load but look cropped on Android**
Android crops to a circle; that's what the `maskable` files are for. If you
regenerate the logo, keep artwork inside the middle 80% of the canvas.

**The buttons open a browser instead of staying "in the app"**
Expected — the Apps Script app is on a different domain, so Android opens it in
a Chrome tab. Attendance works identically; only the launcher runs standalone.

---

## Keeping it in sync

Redeploying a new Apps Script *version* (`clasp deploy -i <existing-id>`)
changes nothing here — the `/exec` URL stays the same, so this launcher keeps
working with no edits. Only creating a brand **new** deployment issues a new
`/exec` URL; in that case, update `DEFAULT_URL` in `index.html` here, re-upload
it to the repo, and every teacher's existing home-screen icon picks it up
automatically next time they open it — no new link to send out.
