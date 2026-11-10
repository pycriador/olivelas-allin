# Makefile for Hortifruti Natural

PYTHON ?= python3
LINT := $(PYTHON) scripts/docs_lint.py

.PHONY: serve docs-validate docs-check-links docs-check-manifest docs-report docs-health

serve:
	$(PYTHON) -m http.server 8000

docs-validate:
	$(LINT) validate

docs-check-links:
	$(LINT) check-links

docs-check-manifest:
	$(LINT) check-manifest

docs-report:
	$(LINT) report

docs-health:
	$(LINT) health
