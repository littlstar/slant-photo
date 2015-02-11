
BIN := node_modules/.bin
DUO := $(BIN)/duo
DUOPIN := $(BIN)/duo-pin
DUOTEST = $(BIN)/duo-test
JS = $(wildcard index.js)
TESTS = $(wildcard test/*.js)

.PHONY: all
all: build/build.js

build/build.js: $(JS) build node_modules
build/example.js: example.js $(JS) build node_modules
build/test.js: $(TESTS) $(JS) build node_modules

build/%.js:
	$(DUO) --development --type js < $< > $@

build:
	@mkdir -p $@

test: build/test.js
	$(DUOTEST) --build $< --commands "make build/test.js" browser chrome

component.json: components/duo.json
	$(DUOPIN)

node_modules: package.json
	@npm install
	@touch $@

.PHONY: clean
clean:
	rm -rf build
	rm -rf components
