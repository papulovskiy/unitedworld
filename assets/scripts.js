var uwo_create = function() {
    this.map = null;
    this.geo = null;
    this.countries = {};
    this.features = {};

    this.store_boundaries = function(geo_json) {
        for(var i in geo_json.features) {
            var country = geo_json.features[i];
            this.countries[country.properties['ISO2']] = country;
            this.features[country.properties['ISO2']] = L.geoJSON(country, {
                style: function(feature) {
                    return {
                        color: '#eee',
                        stroke: false
                    };
                }
            }).addTo(this.map);
        }


        // this.create_underlying_boundaries(geo_json);
        this.draw_dataset('eurozone');
    };

    this.create_underlying_boundaries = function(geo_json) {
        this.geo = L.geoJSON(geo_json, {
            style: function(feature) {
                return {
                    color: '#eee',
                    stroke: false
                };
            }
        }).addTo(this.map);
        // console.log(this.geo);
    };


    this.store_datasets = function(datasets) {
        this._datasets = datasets;
        this.datasets = {};
        for(var i in this._datasets) {
            var dataset = this._datasets[i];
            this.datasets[dataset.url] = dataset;
        }
    };

    this.draw_dataset = function(url) {
        var style_enabled = {
            color: '#f66',
            stroke: true,
            weight: 1,
            opacity: 0.3
        };
        var style_disabled = {
            color: '#000',
            stroke: false
        };
        // TODO: implement existenche check
        var dataset = this.datasets[url];
        var enabled = {};
        for(var i in dataset.countries) {
            enabled[dataset.countries[i]] = true;
        }
        for(var country in this.features) {
            var feature = this.features[country];
            if(country in enabled) {
                console.log('Enabling');
                feature.setStyle(style_enabled);
            } else {
                feature.setStyle(style_disabled);
            }
            // console.log(i);
        }
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
            fetch('data/datasets.json')
                .then(function(response) {
                    response.json().then(function(data) {
                        o.store_datasets(data);
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
