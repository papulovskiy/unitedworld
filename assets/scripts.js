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
        c.innerHTML += '<ul>' + list + '</ul>';

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
        /**
         * Color manipulation functions below are adapted from
         * https://github.com/d3/d3-color.
         */
        var Xn = 0.950470;
        var Yn = 1;
        var Zn = 1.088830;
        var t0 = 4 / 29;
        var t1 = 6 / 29;
        var t2 = 3 * t1 * t1;
        var t3 = t1 * t1 * t1;
        var twoPi = 2 * Math.PI;

        function should_be_transformed(lng, lat) {
            return true;
        }


        /**
         * Convert an RGB pixel into an HCL pixel.
         * @param {Array.<number>} pixel A pixel in RGB space.
         * @return {Array.<number>} A pixel in HCL space.
         */
        function rgb2hcl(pixel) {
            var red = rgb2xyz(pixel[0]);
            var green = rgb2xyz(pixel[1]);
            var blue = rgb2xyz(pixel[2]);

            var x = xyz2lab(
                (0.4124564 * red + 0.3575761 * green + 0.1804375 * blue) / Xn);
            var y = xyz2lab(
                (0.2126729 * red + 0.7151522 * green + 0.0721750 * blue) / Yn);
            var z = xyz2lab(
                (0.0193339 * red + 0.1191920 * green + 0.9503041 * blue) / Zn);

            var l = 116 * y - 16;
            var a = 500 * (x - y);
            var b = 200 * (y - z);

            var c = Math.sqrt(a * a + b * b);
            var h = Math.atan2(b, a);
            if (h < 0) {
                h += twoPi;
            }

            pixel[0] = h;
            pixel[1] = c;
            pixel[2] = l;

            return pixel;
        }


        /**
         * Convert an HCL pixel into an RGB pixel.
         * @param {Array.<number>} pixel A pixel in HCL space.
         * @return {Array.<number>} A pixel in RGB space.
         */
        function hcl2rgb(pixel) {
            var h = pixel[0];
            var c = pixel[1];
            var l = pixel[2];

            var a = Math.cos(h) * c;
            var b = Math.sin(h) * c;

            var y = (l + 16) / 116;
            var x = isNaN(a) ? y : y + a / 500;
            var z = isNaN(b) ? y : y - b / 200;

            y = Yn * lab2xyz(y);
            x = Xn * lab2xyz(x);
            z = Zn * lab2xyz(z);

            pixel[0] = xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
            pixel[1] = xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
            pixel[2] = xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

            return pixel;
        }

        function xyz2lab(t) {
            return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
        }

        function lab2xyz(t) {
            return t > t1 ? t * t * t : t2 * (t - t0);
        }

        function rgb2xyz(x) {
            return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        }

        function xyz2rgb(x) {
            return 255 * (x <= 0.0031308 ?
                12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
        }

        var raster = new ol.source.Raster({
            sources: [new ol.source.Stamen({
                layer: 'watercolor'
            })],
            operation: function(pixels, data) {
                if (!this.example_counter) {
                    this.example_counter = 1;
                }
                if (this.example_counter < 100) {
                    console.log(pixels, data);
                    this.example_counter += 1;
                }
                var hcl = rgb2hcl(pixels[0]);

                var h = hcl[0] + Math.PI * data.hue / 180;
                if (h < 0) {
                    h += twoPi;
                } else if (h > twoPi) {
                    h -= twoPi;
                }
                hcl[0] = h;

                hcl[1] *= (data.chroma / 100);
                hcl[2] *= (data.lightness / 100);

                return hcl2rgb(hcl);
            },
            lib: {
                rgb2hcl: rgb2hcl,
                hcl2rgb: hcl2rgb,
                rgb2xyz: rgb2xyz,
                lab2xyz: lab2xyz,
                xyz2lab: xyz2lab,
                xyz2rgb: xyz2rgb,
                Xn: Xn,
                Yn: Yn,
                Zn: Zn,
                t0: t0,
                t1: t1,
                t2: t2,
                t3: t3,
                twoPi: twoPi
            },
            operationType: 'pixel'
            // threads: 0
        });

        var controls = {};

        raster.on('beforeoperations', function(event) {
            console.log(event);
            var data = event.data;
            // data.e = event;
            for (var id in controls) {
                data[id] = Number(controls[id].value);
            }
        });

        var map = new ol.Map({
            layers: [
                new ol.layer.Image({
                    source: raster
                })
            ],
            target: 'map-container',
            controls: ol.control.defaults({
                attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                    collapsible: false
                })
            }),
            view: new ol.View({
                center: [0, 0],
                zoom: 2
            })
        });
        var controlIds = ['hue', 'chroma', 'lightness'];
        controlIds.forEach(function(id) {
            var control = document.getElementById(id);
            var output = document.getElementById(id + 'Out');
            control.addEventListener('input', function() {
                output.innerText = control.value;
                raster.changed();
            });
            output.innerText = control.value;
            controls[id] = control;
        });

        // this.load_boundaries();
        // this.load_datasets();
    };


    return this;
};


window.onload = function() {
    var uwo = new uwo_create();
    uwo.init();
};
