# experiments/ — A/B Testing

Test different prompts, models, and content angles here before committing to them.

---

## How to Run an Experiment

1. Create a folder: `experiments/YYYY-MM-DD-experiment-name/`
2. Inside it, create:
   - `setup.md` — hypothesis, what you're testing, success criteria
   - `variant_a.md` — first version (control)
   - `variant_b.md` — second version (test)
   - `results.md` — what happened (engagement, quality, etc.)

3. When done, record the winner in `models/model_tracking.md`

---

## Active Experiments

| Experiment | Started | Status |
|------------|---------|--------|
| — | — | — |

---

## Completed Experiments

| Experiment | Winner | Notes |
|------------|--------|-------|
| — | — | — |

---

## Template

Copy this to start a new experiment:

```
experiments/
└── 2026-04-11-phi3-vs-mistral-captions/
    ├── setup.md
    ├── variant_a.md   (Phi-3 output)
    ├── variant_b.md   (Mistral output)
    └── results.md
```
