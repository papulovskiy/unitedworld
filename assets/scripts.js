var uwo_create = function() {
    this.countries = {};

    this.store_boundaries = function(geo_json) {
        for(var i in geo_json.features) {
            var country = geo_json.features[i];
            this.countries[country.properties['ISO2']] = country;
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
        } else {
            // TODO: use XMLHttpRequest
        }

        console.log(this);
    };


    this.init = function() {

        // https://switch2osm.org/using-tiles/getting-started-with-leaflet/

        this.map = L.map('map_container');
        var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
        var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 12, attribution: osmAttrib});
        this.map.setView(new L.LatLng(51.3, 0.7),9);
        this.map.addLayer(osm);


        this.load_boundaries();
    };


    return this;
};


window.onload = function() {
    var uwo = new uwo_create();
    console.log(uwo);
    uwo.init();
};
