//
// Inspired by https://github.com/frogcat/leaflet-tilelayer-mask
//
(function(window) {
    var count = new Date().getTime();
    var $e = function(name, attr) {
        var id = "_leaflet_tilelayer_mask_" + (count++);
        if (document.getElementById(id) != null)
            return $e(name, attr);
        var e = document.createElementNS("http://www.w3.org/2000/svg", name);
        e.setAttribute("id", id);
        if (attr)
            for (key in attr)
                if (key == "href")
                    e.setAttributeNS("http://www.w3.org/1999/xlink", key, attr[key]);
                else
                    e.setAttribute(key, attr[key]);
        return e;
    };

    L.TileLayer.MSVG = L.TileLayer.extend({
        _tileEventHandler: {
            "tileload": function(e) {
                console.log('Loading tile', e, this._svgtiles);
                if (this._svgtiles) {
                    var p = L.DomUtil.getPosition(e.tile);
                    e.tile._svgimg = $e("image", {
                        x: p.x,
                        y: p.y,
                        width: 256,
                        height: 256,
                        href: e.tile.src
                    });
                    this._svgtiles.appendChild(e.tile._svgimg);
                }
            },
            "tileunload": function(e) {
                var img = e.tile._svgimg;
                if (img && img.parentNode)
                    img.parentNode.removeChild(img);
            }
        },
        onAdd: function(map) {
            console.log('Adding a map');
            L.TileLayer.prototype.onAdd.call(this, map);
            this.getContainer().style.display = "none";
            this.on(this._tileEventHandler, this);
            // map.on(this._mapEventHandler, this);

            this._svg = $e("svg", {
                width: "100%",
                height: "100%",
                style: "pointer-events:none;position:relative;"
            });

            this._svgtiles = $e("g", {});

            this._svg.appendChild(this._svgtiles);
            var cnt = map.getContainer();
            cnt.appendChild(this._svg);
        }
    });

    L.tileLayer.mSVG = function(url, options) {
        return new L.TileLayer.MSVG(url, options);
    };
})(window);
