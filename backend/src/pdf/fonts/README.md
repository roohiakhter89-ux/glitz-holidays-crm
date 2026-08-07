# PDF fonts

The PDF templates prefer **Fraunces** (display serif) + **Inter** (body sans)
to match the app UI. If TTF files aren't present here at boot, the templates
fall back to the built-in PDF-14 fonts (Times-Roman + Helvetica) — no crash,
no missing glyphs.

To upgrade, drop these four files in this folder:

```
Fraunces-Regular.ttf
Fraunces-Bold.ttf
Inter-Regular.ttf
Inter-Bold.ttf
```

Get them from:

- Fraunces — https://fonts.google.com/specimen/Fraunces → Download family → extract the static/ folder
- Inter — https://fonts.google.com/specimen/Inter → Download family → extract the static/ folder

Rename the specific weights above and drop them here. Restart the backend and
the next PDF will render in Fraunces + Inter.

Do NOT commit variable-font files here — they render fine but bloat the repo
by ~600 KB and PDF viewers treat them the same as the static instances.
