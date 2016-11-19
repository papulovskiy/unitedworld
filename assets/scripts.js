var uwo_create = function() {
    this.map = null;
    this.geo = null;
    this.countries = {};
    this.features = {};
    this.labels = {};

    this.store_boundaries = function(geo_json) {
        for(var i in geo_json.features) {
            var country = geo_json.features[i];
            var id = country.properties['ISO2'];
            this.countries[id] = country;
        }

        this.create_underlying_boundaries(geo_json);
    };

    this.create_underlying_boundaries = function(geo_json) {
        for(var id in this.countries) {
            var country = this.countries[id];
            this.features[id] = L.geoJSON(country, {
                style: function(feature) {
                    return {
                        color: '#eee',
                        stroke: false
                    };
                }
            }).addTo(this.map);
            this.labels[id] = L.marker([country.properties['LAT'], country.properties['LON']], {
                icon: L.divIcon({
                    className: 'country-label',
                    html: id
                }),
                draggable: false,
                zIndexOffset: 1000
            }).addTo(this.map);
        }
    };


    this.store_datasets = function(datasets) {
        this._datasets = datasets;
        this.datasets = {};
        for(var i in this._datasets) {
            var dataset = this._datasets[i];
            this.datasets[dataset.url] = dataset;
        }
        this.render_controls();
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

        // TODO: implement existence check
        var dataset = this.datasets[url];
        var enabled = {};
        for(var i in dataset.countries) {
            enabled[dataset.countries[i]] = true;
        }

        var bounds = L.latLngBounds();
        for(var country in this.features) {
            var feature = this.features[country];
            if(country in enabled) {
                feature.setStyle(style_enabled);
                bounds.extend(feature.getBounds());
            } else {
                feature.setStyle(style_disabled);
            }
            // console.log(i);
        }
        this.map.flyToBounds(bounds);
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

    };
    this.load_datasets = function() {
        if(self.fetch) {
            console.debug('Loading datasets');
            var o = this;
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
    };

    this.render_controls = function() {
        var c = document.getElementById('controls-container');
        var list = '';
        console.log(this.datasets);
        for(var id in this.datasets) {
            console.debug(id);
            var dataset = this.datasets[id];
            list += '<li><a href="#" data-dataset-id="' + id + '">' + dataset.name + '</a></li>';
        }
        c.innerHTML = '<ul>' + list + '</ul>';

        var o = this;
        c.onclick = function(e) {
            console.log(e);
            e.preventDefault();
            var url = e.target.getAttribute('data-dataset-id');
            if(url) {
                o.draw_dataset(url);
            }
        };
    };


    this.init = function() {

        // https://switch2osm.org/using-tiles/getting-started-with-leaflet/

        this.map = L.map('map-container');
        this.map.setView(new L.LatLng(51.3, 0.7), 2);

        var o = this;
        this.map.on('movestart', function () {
            for(var id in o.labels) {
                o.map.removeLayer(o.labels[id]);
            }
        });
        this.map.on('moveend', function () {
            for(var id in o.labels) {
                o.map.addLayer(o.labels[id]);
            }
        });


        this.load_boundaries();
        this.load_datasets();
    };


    return this;
};


window.onload = function() {
    var uwo = new uwo_create();
    console.log(uwo);
    uwo.init();
};
