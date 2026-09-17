# ic-framework

A clickable prototype of the draft innovation capability framework and how it is measured:
a short orientation, the 43-item survey, and three results views (employee, manager,
organisation).

Live at https://trgallagher-research.github.io/ic-framework/

A plain static site with no build step. GitHub Pages serves the `main` branch root as-is.
The person's answers stay in their browser (localStorage). Everything else is mock data from
a fixed seed.

## What to edit

| What | File |
| --- | --- |
| All on-screen wording, and the sample answers | `content/copy.js` |
| Part and scale names, one-line explanations, skills and practices | `content/domains.js` |
| Colours, type and spacing | `assets/css/tokens.css` |
| Mock data parameters (seed, headcounts, means, effects, pipeline, workshop) | `data/mock-params.js` |
| Mock proposal titles and "what changed" lines | `content/mock-outputs.js` |
| The 43 survey items (must match the document) | `data/items.json` |

## Source

`source/Draft_Innovation_Capability_Framework-v02.docx` is the source of truth for structure,
wording and items. The reviewer note at the top of the draft was removed before it was
committed. The figures in `assets/img/` are extracted from it.

## Checks

```sh
python3 scripts/check_wording.py      # the 43 items in data/items.json equal the document's, in order
node scripts/mock-summary.mjs          # mock dataset shape, means, and determinism
```

To run locally: `python3 -m http.server` in the repo root, then open http://localhost:8000.
The page does not work from `file://`, because it uses ES modules.

`docs/SPEC.md` is the build spec: file layout, data shapes and visual rules.
