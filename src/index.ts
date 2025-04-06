import process from 'process';
import moment from 'moment';

type allowedFieldTypes = Date | number | boolean | string | null;
interface Record {
    [key: string]: allowedFieldTypes;
}
abstract class Importer {
    abstract doImport (fileContent: string): Record[];
}
interface CsvColumnSpec {
    name: string;
    deserialize?: (value: string) => allowedFieldTypes;
}
class CsvImporter extends Importer {
    columnSpecs: CsvColumnSpec[];

    constructor(columnSpecs: CsvColumnSpec[] = []) {
        super();
        this.columnSpecs = columnSpecs;
    }

    doImport(fileContent: string): Record[] {
        const QUOTE = '"';
        const DELIMITER = ',';
        const LINE_SEPARATOR = '\n';

        const records: Record[] = [];
        const lines = fileContent.split(LINE_SEPARATOR).filter(Boolean);
        lines.shift(); // Remove the header line
        for (const line in lines) {
            const record: Record = {};
            const fields = [];
            let currentField = '';
            let inQuotes = false;
            for (const char of lines[line]) {
                if (char === QUOTE) {
                    inQuotes = !inQuotes;
                } else if (char === DELIMITER && !inQuotes) {
                    fields.push(currentField);
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            fields.push(currentField); // Push the last field
            for (let i = 0; i < this.columnSpecs.length; i++) {
                const spec = this.columnSpecs[i];
                const fieldValue = fields[i] || '';
                const header = spec.name;
                record[header] = spec.deserialize ? spec.deserialize(fieldValue) : fieldValue.trim();
            }
            records.push(record);
        }
        return records;
    }
}
interface PrnColumnSpec {
    name: string;
    start: number;
    end: number;
    deserialize?: (value: string) => allowedFieldTypes;
}
class PrnImporter extends Importer {
    columnSpecs: PrnColumnSpec[];

    constructor(columnSpecs: PrnColumnSpec[] = []) {
        super();
        this.columnSpecs = columnSpecs;
    }

    doImport(fileContent: string): Record[] {
        const records: Record[] = [];
        const lines = fileContent.split('\n').filter(Boolean);
        lines.shift(); // Remove the header line
        for (const line of lines) {
            const record: Record = {};
            for (const spec of this.columnSpecs) {
                const field = line.slice(spec.start, spec.end);
                const header = spec.name;
                record[header] = spec.deserialize ? spec.deserialize(field) : field.trim();
            }
            records.push(record);
        }
        return records;
    }
}

abstract class Exporter {
    abstract doExport (data: Record[]): string;
}
class JsonExporter extends Exporter {
    doExport (data: Record[]): string {
        return JSON.stringify(data, null, 2);
    }
}
class HtmlExporter extends Exporter {
    doExport (data: Record[]): string {
        let html = '<table>\n';
        html += '\t<tr>\n';
        for (const key in data[0]) {
            html += `\t\t<th>${key}</th>\n`;
        }
        html += '\t</tr>\n';
        for (const row of data) {
            html += '\t<tr>\n';
            for (const key in row) {
                html += `\t\t<td>${row[key]}</td>\n`;
            }
            html += '\t</tr>\n';
        }
        html += '</table>';
        return html;
    }
}

// Entry point of the application
async function main() {
    // Get all the command line arguments
    // The first two arguments are the path to the node executable and the path to the script
    // The rest are the arguments passed to the script
    // We use destructuring to ignore the first two arguments
    // and get the rest of the arguments in an array
    const [_, __, ...args] = process.argv;

    if (args.length !== 2) {
        console.error('Usage: node index.js <inputFormat> <outputFormat>');
        console.error('Example: cat input.csv | node index.js csv prnt');
        process.exit(1);
    }

    // TODO: Reading from stdin could be handled more elegantly but it works for now
    // Read the input data from stdin
    let stdinContent = '';
    // Set the encoding to binary to avoid issues with character encoding
    process.stdin.setEncoding('binary');
    process.stdin.on('data', (chunk) => {
        stdinContent += chunk;
    });
    process.stdin.on('end', () => {});
    // Wait for the stdin to finish reading
    await new Promise((resolve) => {
        process.stdin.on('end', resolve);
    });

    // Extract the arguments
    const [inputFormat, outputFormat] = args;

    // Create an instance of the appropriate importer based on the input format
    let importer: Importer;
    switch (inputFormat) {
        case 'csv':
            importer = new CsvImporter([
                { name: 'Name',         deserialize: (value) => value.trim() },
                { name: 'Address',      deserialize: (value) => value.trim() },
                { name: 'Postcode',     deserialize: (value) => value.trim() },
                { name: 'Phone',        deserialize: (value) => value.trim() },
                { name: 'Credit Limit', deserialize: (value) => {
                    return Number(value.trim());
                } },
                { name: 'Birthday',     deserialize: (value) => {
                    const date = moment(value.trim(), 'DD/MM/YYYY', true);
                    return date.toDate();
                } },
            ]);
            break;
        case 'prn':
            importer = new PrnImporter([
                { name: 'Name',         start: 0,  end: 15, deserialize: (value) => value.trim() },
                { name: 'Address',      start: 16, end: 37, deserialize: (value) => value.trim() },
                { name: 'Postcode',     start: 38, end: 46, deserialize: (value) => value.trim() },
                { name: 'Phone',        start: 47, end: 61, deserialize: (value) => value.trim() },
                { name: 'Credit Limit', start: 61, end: 73, deserialize: (value) => {
                    const num = Number(value.trim());
                    return num / 100;
                } },
                { name: 'Birthday',     start: 74, end: 82, deserialize: (value) => {
                    const date = moment(value.trim(), 'YYYYMMDD', true);
                    return date.toDate();
                } },
            ]);
            break;
        default:
            console.error(`Unsupported input format: ${inputFormat}`);
            process.exit(1);
    }

    // Process the input data
    const content = importer.doImport(stdinContent);

    // Create an instance of the appropriate exporter based on the output format
    let exporter: Exporter;
    switch (outputFormat) {
        case 'json':
            exporter = new JsonExporter();
            break;
        case 'html':
            exporter = new HtmlExporter();
            break;
        default:
            console.error(`Unsupported output format: ${outputFormat}`);
            process.exit(1);
    }

    // Export the data to the specified format
    const output = exporter.doExport(content);

    // TODO: Handle the output more elegantly and stream it to stdout
    // For now, we just print it to the console
    // Print the output to the console
    console.log(output);
}

// Execute the main function
main();