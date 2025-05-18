// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat); 
    const { x, y } = map.project(point);
    return { cx: x, cy: y };
  }

console.log('Mapbox GL JS Loaded:', mapboxgl);
mapboxgl.accessToken = 'pk.eyJ1IjoidGhlcmVhbGFzcnoiLCJhIjoiY21hcnFld3BoMDNrbzJsb2thMWsybnJ1eSJ9.22i8_ZdUxqJWSUmRu83bNw';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', 
  style: 'mapbox://styles/mapbox/streets-v12', 
  center: [-71.09415, 42.36027], 
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

const svg = d3.select(map.getCanvasContainer())
  .append('svg')
  .style('position', 'absolute')
  .style('z-index', 1)
  .style('width', '100%')
  .style('height', '100%')
  .style('pointer-events', 'none');

const bikeLaneStyle = {
    'line-color': '#32D400',  
    'line-width': 4,
    'line-opacity': 0.6
  };

map.on('load', async () => {
    const svg = d3.select('#map').select('svg');
    map.addSource('boston_route', {
      type: 'geojson',
      data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson',
    });
  
    map.addLayer({
      id: 'bike-lanes',
      type: 'line',
      source: 'boston_route',
      paint: bikeLaneStyle
    });

    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://api.allorigins.win/raw?url=https://www.cambridgema.gov/-/media/Files/CDD/Transportation/bikeplan/cambridgebikelanes.geojson'
      });
    
    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: bikeLaneStyle
      });

        const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
        const jsonData = await d3.json(jsonurl);
        
        let stations = jsonData.data.stations.filter(d => 
            !isNaN(d.lon) && !isNaN(d.lat)
          );
        const trips = await d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv');
        const departures = d3.rollup(
          trips,
          v => v.length,
          d => d.start_station_id
        );
        const arrivals = d3.rollup(
          trips,
          v => v.length,
          d => d.end_station_id
        );

        stations = stations.map((station) => {
          const id = station.station_id; 
        
          station.departures = departures.get(id) ?? 0;
          station.arrivals = arrivals.get(id) ?? 0;
          station.totalTraffic = station.departures + station.arrivals;
        
          return station;
        });

        const radiusScale = d3.scaleSqrt().domain([0, d3.max(stations, (d) => d.totalTraffic)]).range([0, 25]);
        
        console.log('Enriched stations with traffic:', stations);
        console.log('Trips data loaded:', trips);
        console.log('First station:', stations[0]);
        console.log('Loaded JSON Data:', jsonData);
        console.log('Stations Array:', stations);

        
        const circles = svg
        .selectAll('circle')
        .data(stations)
        .enter()
        .append('circle')
        .attr('r', d => radiusScale(d.totalTraffic)) // Radius of the circle
        .attr('fill', 'steelblue') // Circle fill color
        .attr('stroke', 'white') // Circle border color
        .attr('stroke-width', 1) // Circle border thickness
        .attr('opacity', 0.8); // Circle opacity

        function updatePositions() {
            circles
              .attr('cx', (d) => getCoords(d).cx) // Set the x-position using projected coordinates
              .attr('cy', (d) => getCoords(d).cy); // Set the y-position using projected coordinates
          }

        updatePositions();

  map.on('move', updatePositions);
  map.on('zoom', updatePositions);
  map.on('resize', updatePositions);
  map.on('moveend', updatePositions); 
    
     
  });



