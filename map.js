
const mapOptions = {
    center: [55.7522, 37.6156],
    zoom: 14
};

const map = L.map('map', mapOptions);
const attribution ='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

let db = './tourist_attraction.csv';


new Autocomplete("search", {
    selectFirst: true,
    howManyCharacters: 2,

    onSearch: ({ currentValue }) => {
        const api = `https://nominatim.openstreetmap.org/search?format=geojson&limit=5&city=${encodeURI(
            currentValue
        )}`;

        return new Promise((resolve) => {
            fetch(api)
                .then((response) => response.json())
                .then((data) => {
                    resolve(data.features);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    },

    onResults: ({ currentValue, matches, template }) => {
        const regex = new RegExp(currentValue, "gi");
        return matches === 0
            ? template
            : matches
                .map((element) => {
                    return `
          <li style="color: black" class="loupe">
            <p>
              ${element.properties.display_name.replace(
                        regex,
                        (str) => `<b>${str}</b>`
                    )}
            </p>
          </li> `;
                })
                .join("");
    },


    onSubmit: ({ object }) => {


        map.eachLayer(function (layer) {
            if (!!layer.toGeoJSON) {
                map.removeLayer(layer);
            }
        });

        const { display_name } = object.properties;
        const [lng, lat] = object.geometry.coordinates;

        const point = L.marker([lat, lng], {
            title: display_name,
        });

        point.addTo(map).bindPopup(display_name);

        $.get(db, function (csvString) {
            const attractions = Papa.parse(csvString, {header: true, dynamicTyping: true}).data;

            for (let i in attractions) {
                let attraction = attractions[i];
                let image = attraction.image;
                let marker = L.marker([attraction.lat, attraction.lon], {
                    opacity: 1,
                }).bindPopup('<p style="color:black">' + attraction.name + '</p>' + '<img src="' + image + '"style="width: 300px" alt="attraction"/>');
                marker.addTo(map);
            }
        });

        map.setView([lat, lng], 10);
    },

    onSelectedItem: ({ index, element, object }) => {
        console.log("onSelectedItem:", index, element, object);

    },

    noResults: ({ currentValue, template }) =>
        template(`<li>No results found: "${currentValue}"</li>`),
});




