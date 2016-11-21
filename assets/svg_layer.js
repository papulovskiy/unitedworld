(function(window) {
    L.TileLayer.MSVG = L.TileLayer.extend({

    });

    L.tileLayer.mSVG = function(url, options) {
        return new L.TileLayer.MSVG(url, options);
    };
})(window);
