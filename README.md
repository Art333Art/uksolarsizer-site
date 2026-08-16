# UK Solar Sizer site

Lightweight static landing page for [uksolarsizer.co.uk](https://uksolarsizer.co.uk/), linking to the existing [UK Solar & Battery System Sizer](https://uksolarsizer.streamlit.app).

## Local preview

Serve this directory with any static HTTP server. No build step or dependencies are required.

## Deployment

The repository contains plain HTML and CSS suitable for static hosting. DNS and hosting configuration are intentionally not included.

## Pages

- `/` — calculator landing page
- `/solar-panel-sizing/` — array kWp, panel count and roof constraints
- `/home-battery-sizing/` — usable capacity, power and tariff charging
- `/solar-panel-costs-payback/` — quotations, savings and simple payback
- `/electricity-usage-solar/` — annual kWh, smart-meter timing and future demand
- `/diy-home-battery/` — planning hub for LFP and second-life storage
- `/second-life-ev-battery-home-storage/` — substantial second-life EV battery reference
- `/battery-storage-without-solar/` — cheap-tariff battery-only economics
- `/nissan-leaf-battery-home-storage/` — evidence-led Leaf pack overview
- `/lfp-vs-second-life-ev-battery/` — complete-system comparison
- `/48v-vs-high-voltage-battery-storage/` — voltage architecture guide
- `/v2l-v2h-v2g-explained/` — vehicle-energy concepts
- `/uk-battery-storage-grid-rules/` — G98/G99/G100 planning overview

## Structured data and checks

Commercial links are centrally controlled in `data/commercial-links.json` and default to disabled/absent until genuine destinations are verified. Battery-family and cost-model data live in `data/` for future calculators.

Run `python tools/validate_site.py` before publishing. Run `python tools/content_review.py 365` to list material whose `dateModified` is older than the chosen number of days.
