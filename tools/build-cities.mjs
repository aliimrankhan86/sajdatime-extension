/**
 * Build `public/data/cities.json` from GeoNames `cities5000.txt`.
 *
 * The source is not committed because it is 5.5 MB zipped. Download it, unzip it, then:
 *   node tools/build-cities.mjs /path/to/cities5000.txt
 *
 * GeoNames data is licensed CC BY 4.0. `public/THIRD-PARTY-NOTICES.txt` carries the credit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node tools/build-cities.mjs /path/to/cities5000.txt');
  process.exit(1);
}

const rows = [];
for (const line of readFileSync(source, 'utf8').split('\n')) {
  if (!line) continue;
  const fields = line.split('\t');
  if (fields.length < 19) continue;
  const population = Number(fields[14]);
  if (!Number.isInteger(population) || population < 0) continue;
  rows.push({
    name: fields[1],
    ascii: fields[2],
    country: fields[8],
    latitude: Number(fields[4]),
    longitude: Number(fields[5]),
    timeZone: fields[17],
    population,
    // GeoNames' feature code marks a section of a populated place, such as a borough,
    // a quarter or a district of a city. The nearest non-section names a located point.
    section: fields[7] === 'PPLX',
  });
}
rows.sort((a, b) => b.population - a.population);

const timeZones = [...new Set(rows.map((row) => row.timeZone))].sort();
const countries = [...new Set(rows.map((row) => row.country))].sort();
const timeZoneIndex = new Map(timeZones.map((zone, index) => [zone, index]));
const countryIndex = new Map(countries.map((code, index) => [code, index]));

const data = {
  timeZones,
  countries,
  cities: rows.map((row) => [
    row.name,
    row.ascii === row.name ? 0 : row.ascii,
    countryIndex.get(row.country),
    Math.round(row.latitude * 100) / 100,
    Math.round(row.longitude * 100) / 100,
    timeZoneIndex.get(row.timeZone),
    row.population,
    row.section ? 1 : 0,
  ]),
};

const target = resolve('public/data/cities.json');
writeFileSync(target, JSON.stringify(data));
const sections = rows.filter((row) => row.section).length;
console.log(
  `${target}: ${data.cities.length} places (${sections} sections), ${timeZones.length} time zones, ${countries.length} countries`,
);
