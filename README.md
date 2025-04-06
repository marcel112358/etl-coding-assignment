# Data format translation program

## The task

Given are two files - both contain the same content - one is a CSV file the other is a PRN file,
we want you write a command line utility which will read these CSV files and PRN files from stdin and,
based on a command line option, print either JSON or HTML to stdout, so that it would work as part of a
command pipeline.

Input with differing formats (e.g. dates, currency) should produce identical output.
This means that irrespective of whether the input data format was CSV or PRN, the output should
be the same. There will be a check for differences in the evaluation.

Non ASCII characters should be handled and rendered correctly.

No content should be lost in translation and all output should be readable when encoded to UTF-8.

The solution will be tested like this

```
cat ./Workbook2.csv | your-solution csv html > csv.html.txt
cat ./Workbook2.prn | your-solution prn html > prn.html.txt
diff csv.html.txt prn.html.txt
cat ./Workbook2.csv | your-solution csv json > csv.json.txt
cat ./Workbook2.prn | your-solution prn json > prn.json.txt
diff csv.json.txt prn.json.txt
```

## How to proceed

Solution TS is required. Any open source libraries which make life easier for you are of course allowed.

## Assignment focus

1. The implemented solution should work correctly and be coded according to the instructions.
2. Solution architecture, code splitting, modularity, separation of concerns.
3. Testing approach and tests - be it unit, integration or e2e tests.
4. Type-safety in the context of the problem, data processing and data output.

## How to deliver

Upload the solution to GitHub.

Make regular commits and pushes, so that we can see the evolution of the solution.

## Deadline

You have 72 hours to complete the task. We reckon a couple of evenings should be enough.

## Solution Remarks

For simplicity, I used `make` to test, since the test script was straightforward.

Out of curiosity, I tried Bun to see how it compiles TypeScript.

Limitations:
- Inferring CSV schemas is flaky — it's often unclear if a value is a number or a string (not in our specific example but when you try to generalize).
- Inferring PRN schemas seems basically impossible. Even SheetJS and Pandas struggle. Excel's importer also required significant tweaking (column boundaries, format, etc.).

Given this, I decided we need to explicitly define the import schema to ensure correct and reproducible script behavior.

Next steps:
- Modularize / move the classes in separate files
- Set up some unit tests
- Properly handle piped input to read and write the stream. This is important when the files get bigger.

Remark: I spent quite some time on encoding issues — turns out it worked fine by reading the stream as binary and letting TypeScript guess the encoding.