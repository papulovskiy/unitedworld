var uwo_create = function() {
    this.countries = {};

    this.store_boundaries = function(geo_json) {
        for(var i in geo_json.features) {
            var country = geo_json.features[i];
            this.countries[country.properties['ISO2']] = country;
        }

        L.geoJSON(geo_json, {
            style: function(feature) {
                if(['RU', 'IN', 'FR', 'CA', 'BR'].indexOf(feature.properties['ISO2']) >= 0) {
                    return {
                        color: '#f00',
                        stroke: false
                    };
                }
                if(['DE', 'ES', 'AU'].indexOf(feature.properties['ISO2']) >= 0) {
                    return {
                        color: '#00f',
                        stroke: false
                    };
                }
                if(['CZ', 'US', 'AR'].indexOf(feature.properties['ISO2']) >= 0) {
                    return {
                        color: '#0f0',
                        stroke: false
                    };
                }
                if(['NL', 'BE', 'LU', 'GB', 'UK'].indexOf(feature.properties['ISO2']) >= 0) {
                    return {
                        color: '#ff0',
                        stroke: false
                    };
                }
                if(['IR', 'PT', 'IT', 'CH', 'PL'].indexOf(feature.properties['ISO2']) >= 0) {
                    return {
                        color: '#f0f',
                        stroke: false
                    };
                }
                return {
                    color: '#000',
                    stroke: false
                };
            }
        }).addTo(this.map);
    };

    this.load_boundaries = function() {
        if(self.fetch) {
            console.debug('Loading boundaries');
            var o = this;
            fetch('data/boundaries.json')
                .then(function(response) {
                    response.json().then(function(data) {
                        o.store_boundaries(data);
                    });
                })
                .catch(function(err) {
                    // TODO: implement error handling
                });
        } else {
            // TODO: use XMLHttpRequest
        }

        console.log(this);
    };


    this.init = function() {

        // https://switch2osm.org/using-tiles/getting-started-with-leaflet/

        this.map = L.map('map_container');
        this.map.setView(new L.LatLng(51.3, 0.7), 2);


        this.load_boundaries();
    };


    return this;
};


window.onload = function() {
    var uwo = new uwo_create();
    console.log(uwo);
    uwo.init();
};
