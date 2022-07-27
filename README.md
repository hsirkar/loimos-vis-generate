Generates GeoJSON data for state and county boundaries for use with [Loimos Vis](https://github.com/loimos/vis).

## Usage

Make sure you have Node.js installed, then:

    git clone https://github.com/hsirkar/loimos-vis-generate
    cd loimos-vis-generate
    npm install
    node generate.js

This will generate 2 json files, one for state and one for county boundaries. Copy these files into Loimos Vis as needed.

## References

- [US Census Bureau data](https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html)
- [Mapbox blog post about Albers projection](https://blog.mapbox.com/mapping-the-us-elections-guide-to-albers-usa-projection-in-studio-45be6bafbd7e)
- [Mapshaper issue](https://github.com/developmentseed/dirty-reprojectors/issues/13)