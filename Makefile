TESTS=$(shell find test -name "*.test.js")
MOCHA='./node_modules/.bin/mocha'

spec:
	$(MOCHA) --reporter spec $(TESTS)

tap:
	$(MOCHA) --reporter tap $(TESTS)

test:
	$(MOCHA) $(TESTS)

.PHONY: test spec
