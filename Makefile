MY_SOLUTION = ./build/mycli

all: build/mycli
	mkdir -p output
	cat ./Workbook2.csv | $(MY_SOLUTION) csv html > output/csv.html.txt
	cat ./Workbook2.prn | $(MY_SOLUTION) prn html > output/prn.html.txt
	diff output/csv.html.txt output/prn.html.txt
	cat ./Workbook2.csv | $(MY_SOLUTION) csv json > output/csv.json.txt
	cat ./Workbook2.prn | $(MY_SOLUTION) prn json > output/prn.json.txt
	diff output/csv.json.txt output/prn.json.txt

build/mycli: src/*
	@if ! command -v bun &> /dev/null; then \
		echo "bun could not be found, please install bun"; \
		exit 1; \
	fi

	bun build ./src/index.ts --compile --outfile build/mycli