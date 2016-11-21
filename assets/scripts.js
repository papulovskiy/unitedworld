var uwo_create = function() {
    this.map = null;
    this.geo = null;
    this.countries = {};
    this.features = {};
    this.labels = {};

    this.store_boundaries = function(geo_json) {
        for (var i in geo_json.features) {
            var country = geo_json.features[i];
            var id = country.properties['ISO2'];
            this.countries[id] = country;
        }

        this.create_underlying_boundaries(geo_json);
    };

    this.create_underlying_boundaries = function(geo_json) {
        for (var id in this.countries) {
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
        for (var i in this._datasets) {
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
        for (var i in dataset.countries) {
            enabled[dataset.countries[i]] = true;
        }

        var bounds = L.latLngBounds();
        for (var country in this.features) {
            var feature = this.features[country];
            if (country in enabled) {
                feature.setStyle(style_enabled);
                bounds.extend(feature.getBounds());
            } else {
                feature.setStyle(style_disabled);
            }
            // console.log(i);
        }

        this.adjust_to_bounds(bounds);
    };

    this.adjust_to_bounds = function(b2) {
        var b1 = this.map.getBounds();
        var diff_west = Math.abs(((-180 - b2.getWest()) - (-180 - b1.getWest())) / (-180 - b1.getWest())),
            diff_east = Math.abs(((180 - b2.getEast()) - (180 - b1.getEast())) / (180 - b1.getEast())),
            diff_north = Math.abs(((90 - b2.getNorth()) - (90 - b1.getNorth())) / (90 - b1.getNorth())),
            diff_south = Math.abs(((-90 - b2.getSouth()) - (-90 - b1.getSouth())) / (-90 - b1.getSouth()));
        // TODO: take zoom level into consideration or make these calculations better
        if (Math.max(diff_west, diff_east, diff_north, diff_south) >= 2 || !b1.contains(b2)) {
            this.map.flyToBounds(b2);
        }
    };

    this.load_boundaries = function() {
        if (self.fetch) {
            console.debug('Loading boundaries');
            var o = this;
            fetch('data/boundaries.json')
                .then(function(response) {
                    if (response.ok) {
                        response.json().then(function(data) {
                            o.store_boundaries(data);
                        });
                    } else {
                        o.load_error();
                    }
                })
                .catch(function(err) {
                    o.load_error();
                });
        } else {
            // TODO: use XMLHttpRequest
        }

    };
    this.load_datasets = function() {
        if (self.fetch) {
            console.debug('Loading datasets');
            var o = this;
            fetch('data/datasets.json')
                .then(function(response) {
                    if (response.ok) {
                        response.json().then(function(data) {
                            o.store_datasets(data);
                        });
                    } else {
                        o.load_error();
                    }
                })
                .catch(function(err) {
                    o.load_error();
                });
        } else {
            // TODO: use XMLHttpRequest
        }
    };

    this.load_error = function() {
        document.getElementsByTagName('body')[0].className += ' error';
    };

    this.render_controls = function() {
        var c = document.getElementById('controls-container');
        var list = '';
        console.log(this.datasets);
        for (var id of Object.keys(this.datasets).sort()) {
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
            if (url) {
                o.draw_dataset(url);
            }
        };
    };


    this.init = function() {

        // https://switch2osm.org/using-tiles/getting-started-with-leaflet/

        this.map = L.map('map-container');
        this.map.setView(new L.LatLng(51.3, 0.7), 2);

        var o = this;
        this.map.on('movestart', function() {
            for (var id in o.labels) {
                o.map.removeLayer(o.labels[id]);
            }
        });
        this.map.on('moveend', function() {
            for (var id in o.labels) {
                o.map.addLayer(o.labels[id]);
            }
        });

        L.tileLayer.mSVG('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {foo: 'bar'}).addTo(this.map);

        // this.load_boundaries();
        this.load_datasets();
    };


    return this;
};


window.onload = function() {
    var uwo = new uwo_create();
    uwo.init();
};
