# LCVN

Project page for **Language-Conditioned World Modeling for Visual Navigation** — NeurIPS 2026 Oral.

[Website](https://f1y1113.github.io/lcvn-project/) · [Paper](https://arxiv.org/abs/2603.26741) · [Code](https://github.com/UWMILab/LCVN) · [Dataset](https://huggingface.co/datasets/fly1113/LCVN)

The page includes recorded navigation episodes, method diagrams, and the qualitative and quantitative results reported in the paper. The visual comparisons use published figures; they do not run model inference in the browser.

## Local preview

```sh
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). The site uses plain HTML, CSS and JavaScript; no build step is needed. GitHub Pages serves the `main` branch.

## Credits

Visual design reference: [ORBIA](https://orbia-bench.github.io/). Paper figures and recorded examples come from the LCVN paper and dataset. Fonts are bundled with their SIL Open Font License notices. Source records are in `assets/*provenance.json`.
