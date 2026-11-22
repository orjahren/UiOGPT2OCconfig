.PHONY: build typecheck run

build:
	npm run build

typecheck:
	npm run typecheck

run: build
	node dist/index.js
