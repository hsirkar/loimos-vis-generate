// This file is used to generate GeoJSON data that is bundled with the loimos-vis tool
const axios = require('axios').default;
const AdmZip = require('adm-zip');
const mapshaper = require('mapshaper');

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

(async () => {
    // Get state data
    console.log('Downloading state data...');
    const states_url = 'https://www2.census.gov/geo/tiger/GENZ2021/shp/cb_2021_us_state_20m.zip';
    const states_body = await axios.get(states_url, { responseType: 'arraybuffer' });
    const states_zip = new AdmZip(states_body.data);
    states_zip.extractAllTo('temp', true);
    
    // Get county data
    console.log('Downloading county data...');
    const counties_url = 'https://www2.census.gov/geo/tiger/GENZ2021/shp/cb_2021_us_county_20m.zip';
    const counties_body = await axios.get(counties_url, { responseType: 'arraybuffer' });
    const counties_zip = new AdmZip(counties_body.data);
    counties_zip.extractAllTo('temp', true);

    // Convert to geojson
    console.log('Converting to geojson...');
    mapshaper.runCommands('./temp/cb_2021_us_state_20m.shp -o gj2008 temp/cb_2021_us_state_20m.json format=geojson')
    mapshaper.runCommands('./temp/cb_2021_us_county_20m.shp -simplify 40% -o gj2008 temp/cb_2021_us_county_20m.json format=geojson')

    // Convert geojson files to albers usa projection
    console.log('Converting to albers...');
    await exec('npm install -g dirty-reprojectors');
    await exec('cat temp/cb_2021_us_state_20m.json | dirty-reproject --forward albersUsa > temp/states_albers.json');
    await exec('cat temp/cb_2021_us_county_20m.json | dirty-reproject --forward albersUsa > temp/counties_albers.json');

    // Get population data
    console.log('Downloading population data...');
    const pop_url = 'https://www2.census.gov/programs-surveys/popest/datasets/2020-2021/counties/totals/co-est2021-alldata.csv';
    const pop_body = await axios.get(pop_url, { responseType: 'text' });
    const pop_data = pop_body.data.split('\n').map(row => row.split(','));

    // Modify metadata
    console.log('Modifying feature properties...');
    const states = require('./temp/states_albers.json').features.map(
        ({ properties, bbox, ...rest }) => ({
            ...rest,
            properties: {
                fips: properties.STATEFP,
                name: properties.NAME,
                abbr: properties.STUSPS,
                population: (() => {
                    const entry = pop_data.find(
                        (row) => row[0] === '040' && row[3] === properties.STATEFP
                    );
                    return entry ? parseInt(entry[9]) : 0;
                })(),
            },
            bbox,
        })
    );

    const counties = require('./temp/counties_albers.json').features.map(
        ({ properties, bbox, ...rest }) => ({
            ...rest,
            properties: {
                fips: properties.STATEFP + properties.COUNTYFP,
                stateFips: properties.STATEFP,
                countyFips: properties.COUNTYFP,
                name: properties.NAMELSAD,
                stateName: properties.STATE_NAME,
                stateAbbr: properties.STUSPS,
                population: (() => {
                    const entry = pop_data.find(
                        (row) =>
                            row[3] === properties.STATEFP &&
                            row[4] === properties.COUNTYFP
                    );
                    return entry ? parseInt(entry[9]) : 0;
                })(),
            },
            bbox,
        })
    );

    // Export final files
    console.log('Exporting geojson files...');
    if (!fs.existsSync('output')) {
        fs.mkdirSync('output');
    }
    fs.writeFileSync(
        './output/states.json',
        JSON.stringify({ type: 'FeatureCollection', features: states })
    );
    fs.writeFileSync(
        './output/counties.json',
        JSON.stringify({ type: 'FeatureCollection', features: counties })
    );
})();