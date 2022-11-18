
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const fastcsv = require('fast-csv');
const db = require('./db');
const contains = require('validator/lib/contains');

function createTranslation() {
    const id = 6
    const created_at = '2022 - 01 - 05 08: 00: 00 + 08'
    const name = 'HiMetal Enterprise Pte Ltd'
    const bio = 'HiMetal Enterprise specialises in supplying Stainless Steel products in Singapore. We supply a wide range of flat and long products to our valued customers for retail, wholesale and project order. We also engage in trading business for indent orders of Stainless Steel, Ferrous and Non-Ferrous materials.'
    const website = 'https://www.himetal.com.sg/'
    const visible = 1

    return `${id},${created_at},${name},${bio},${website}${visible}\n`;
}
function insertFromCsv() {
    let csvData = [];
    return (
        fastcsv
            .parse()
            // validate that the column key doesn't contain any commas, as some countries do. This will break our insertion as it would be treated as an extra column and our table expects only 3 columns
            .validate((data) => !contains(data[0], ','))
            // triggered when a new record is parsed, we then add it to the data array
            .on('data', (data) => {
                csvData.push(data);
            })
            .on('data-invalid', (row, rowNumber) =>
                console.log(
                    `Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`
                )
            )
            // once parsing is finished and all the data is added to the array we can then insert it into the db table
            .on('end', () => {
                // The insert statement
                //                 const query1 = `SET LOCAL var.logged_user = 1;`
                //                 const query = `
                // INSERT INTO ums.companies (
                // id, created_at, visible, website, name, bio) VALUES (
                // '6'::integer, '2022-01-05 00:00:00 UTC'::timestamp with time zone, '1'::smallint, 'https://www.himetal.com.sg/'::character varying, 
                // 	'HiMetal Enterprise Pte Ltd'::character varying, 
                //     'HiMetal Enterprise specialises in supplying Stainless Steel products in Singapore. We supply a wide range of flat and long products to our valued customers for retail, wholesale and project order. We also engage in trading business for indent orders of Stainless Steel, Ferrous and Non-Ferrous materials.'::character varying)
                //  returning id,name;`
                const query = INSERT

                // Connect to the db instance
                db.connect((err, client, done) => {
                    if (err) throw err;
                    try {
                        // loop over the lines stored in the csv file
                        csvData.forEach((row) => {
                            // For each line we run the insert query with the row providing the column values
                            client.query(query1, query, row, (err, res) => {
                                if (err) {
                                    // We can just console.log any errors
                                    console.log(err.stack);
                                } else {
                                    console.log('inserted ' + res.rowCount + ' row:', row);
                                }
                            });
                        });
                    } finally {
                        done();
                    }
                });
            })
    );
}


// The path to write the csv file to
const output = './src/output.csv';

// other functions..

// Create a stream to write to the csv file
const stream = fs.createWriteStream(output);

async function writeToCsvFile() {
    // The user can specify how many rows they want to create (yarn seed --rows=20), if they dont specify anything (yarn seed) then defaults to 10
    let rows = args['rows'] || 1;
    // Iterate x number of times and write a new line to the csv file using the createTranslation function
    for (let index = 0; index < rows; index++) {
        stream.write(createTranslation(), 'utf-8');
    }
    stream.end();
}

async function seed() {
    await writeToCsvFile();
    let stream = fs.createReadStream(output);
    stream.pipe(insertFromCsv());
}

seed();