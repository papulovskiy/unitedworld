//
// Inspired and based on https://github.com/frogcat/leaflet-tilelayer-mask
//
//
(function(window) {
    /*
     */
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
        /*
         */
        _tileEventHandler: {
            "tileload": function(e) {
                console.log('Loading tile', e, e.tile, this._svgtiles);
                if (this._svgtiles) {
                    var p = L.DomUtil.getPosition(e.tile);
                    console.debug(L.DomUtil.getPosition(this.getContainer()));
                    console.log(this._map, e, p);
                    e.tile._svgimg = $e("image", {
                        x: p.x,
                        y: p.y,
                        // x: e.tile._leaflet_pos.x,
                        // y: e.tile._leaflet_pos.y,
                        width: e.tile.width,
                        height: e.tile.height,
                        href: e.tile.src
                    });
                    this._svgtiles.appendChild(e.tile._svgimg);
                }
            },
            "tileunload": function(e) {
                var img = e.tile._svgimg;
                if (img && img.parentNode) {
                    img.parentNode.removeChild(img);
                }
            }
        },
        _syncLayer: function() {
            /*
                This is very ugly, but I still have not found a way to understand that
                Leaflet is actually applied some transformtaion to the original layer.
            */
            if(this.getContainer().firstChild && this.getContainer().firstChild.style.transform && this._actual_svg) {
                this._actual_svg.setAttribute("style", "transform: " + this.getContainer().firstChild.style.transform);
            }
        },
        _syncContainer: function() {
            /*
                This is very ugly, but I still have not found a way to understand that
                Leaflet is actually applied some transformtaion to the original layer.
            */
            // console.log(this._map.getContainer().firstChild);
            if(this._map.getContainer().firstChild && this._map.getContainer().firstChild.style.transform && this._svg) {
                this._masked_container.setAttribute("style", "transform: " + this._map.getContainer().firstChild.style.transform);
            }
        },
        _mapEventHandler: {
            "move": function(e) {
                // var centerPoint = map.getSize().divideBy(2),
                //     targetPoint = centerPoint.subtract([overlayWidth, 0]),
                //     targetLatLng = map.containerPointToLatLng(centerPoint);
                console.log("Move");
                if (this._actual_svg && this._map) {
                    var p = this._map.containerPointToLayerPoint([0, 0]);
                    // this._actual_svg.setAttribute("x", -p.x);
                    // this._actual_svg.setAttribute("y", -p.y);
                }
                this._syncLayer();
                this._syncContainer();
            },
            "viewreset": function(e) {
                console.log('View Reset');
                if (this._svgtiles) {
                    while (this._svgtiles.firstChild) {
                        this._svgtiles.removeChild(this._svgtiles.firstChild);
                    }
                }
            },
            "zoomstart": function(e) {
                console.log("Zoom start");
                if (this._svg) {
                    // this._svg.style.opacity = 0.5;
                }
                if (this._svgtiles) {
                    console.log("Deleting tiles");
                    while (this._svgtiles.firstChild) {
                        this._svgtiles.removeChild(this._svgtiles.firstChild);
                    }
                }
            },
            "zoomend": function(e) {
                console.log("Zoom end", this._map, e);
                if (this._svg) {
                    // this._svg.style.opacity = 1.0;
                }
                if (this._actual_svg && this._map) {
                    console.log("Zoom ended, need to adjust a layer");
                    var p = this._map.containerPointToLayerPoint([0, 0]);
                    // this._actual_svg.setAttribute("x", -p.x);
                    // this._actual_svg.setAttribute("y", -p.y);
                }
                this._syncLayer();
            }
        },
        onAdd: function(map) {
            console.log('Adding a map');
            L.TileLayer.prototype.onAdd.call(this, map);
            this.getContainer().style.display = "none";
            this.on(this._tileEventHandler, this);
            map.on(this._mapEventHandler, this);
            map.on('viewreset', function(e) {
                console.debug('viewreset', e);
            });

            this._svg = $e("svg", {
                width: "100%",
                height: "100%",
                style: "pointer-events:none;opacity:0.8;z-index:999;",
                    // style: "position:relative;"
                class: "leaflet-layer"
            });

            this._defs = $e("defs");
            this._svgtiles = $e("g", {
                id: "svgtiles"
            });

            this._filter = $e("filter", {
                id: "grayscale"
            });
            var filter_options = $e("feColorMatrix", {
                type: "saturate",
                values: "0"
            });
            this._filter.appendChild(filter_options);
            this._svg.appendChild(this._filter);

            this._masked_container = $e("g", {
            });
            this._masked = $e("g", {
            });
            this._actual_svg = $e("use", {
                href: "#" + this._svgtiles.getAttribute("id"),
                filter: "url(#grayscale)"
            });
            // this._syncLayer();
            this._masked_container.appendChild(this._actual_svg);
            this._masked.appendChild(this._masked_container);

            this._defs.appendChild(this._svgtiles);
            this._svg.appendChild(this._defs);
            this._svg.appendChild(this._masked);
            var cnt = map.getContainer();
            // var cnt = this.getContainer().parentNode.parentNode;
            cnt.appendChild(this._svg);
            this.setCenter(cnt.clientWidth * 0.5, cnt.clientHeight * 0.5);
        },
        setCenter: function(x, y) {
            return this;
        }

    });

    L.tileLayer.mSVG = function(url, options) {
        return new L.TileLayer.MSVG(url, options);
    };
})(window);
