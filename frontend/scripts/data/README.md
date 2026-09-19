# Hero Earth geography

`ne_110m_land.geojson` is the Natural Earth 1:110m physical land dataset.

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
- License: public domain, https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved: 2026-09-14. The generated SVG records the source SHA-256.

This is build-time input only. `node scripts/generate-hero-earth.mjs` creates the
local static SVG; neither the data nor the sampling code is sent to the browser.
The hero uses ordinary HTML for text and controls, CSS for layout/ambient light,
and SVG gradients/paths for the globe, routes, and fabric-inspired folds.

The folds are an illustrative vector interpretation, not a physically simulated
cloth render or an exact reproduction of the reference bitmap. The separate
traffic overlay uses a handful of native SVG motion paths; no canvas/WebGL,
third-party requests, or additional dependency is needed.
