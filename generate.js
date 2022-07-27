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
    if (!fs.existsSync('output')){
        fs.mkdirSync('output');
    }
    await exec('npm install -g dirty-reprojectors');
    await exec('cat temp/cb_2021_us_state_20m.json | dirty-reproject --forward albersUsa > output/states.json');
    await exec('cat temp/cb_2021_us_county_20m.json | dirty-reproject --forward albersUsa > output/counties.json');

    console.log('Done!');
})();