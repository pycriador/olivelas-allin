# Scripts & Tooling

This directory contains standard Python validation scripts for documentation integrity.

## Available Scripts

- **`docs_lint.py`**: Standard library documentation validator.
  - `python scripts/docs_lint.py validate`: Validates frontmatters, link integrity, bilingual parity, and manifest consistency.
  - `python scripts/docs_lint.py check-links`: Fast link checker.
  - `python scripts/docs_lint.py check-manifest`: Checks document manifest completeness.
  - `python scripts/docs_lint.py report`: Generates `docs/en/reports/documentation-health.md`.
