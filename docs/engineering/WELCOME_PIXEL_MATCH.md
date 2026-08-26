# Welcome Screen Pixel Match

The creator-approved welcome reference is implemented as real UI rather than a raster background.

Reference desktop geometry (1672×941):
- E · I · L top: 17.53%
- Four-line headline top: 29.97%
- CTA top: 71.73%
- Tourmaline ink: #1A1408
- Crystal gold: #D0AA5E
- Warm milky backdrop: #FBF4EE → #F6EEE8 → #F0E3D9

The welcome uses semantic text, a real button, CSS bokeh lights, a lower light floor and reusable Liquid Glass tokens. The regression guard `scripts/quality/verify-welcome-pixel-match.mjs` prevents a raster-image fallback or the removed legacy welcome containers from returning.
