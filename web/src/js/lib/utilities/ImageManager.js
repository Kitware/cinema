(function () {
    /**
     * The ImageManager is in charge of actually downloading and
     * caching raw image for a given VisualizationModel.
     * Usage example:
     *
     *    var mgr = new cinema.utilities.ImageManager({
     *        visModel: myVisualizationModel
     *    };
     *    mgr.on('c:data.ready', function (payload) {
     *        // image available draw it ...
     *    }, this).on('c:error', function (e) {
     *        console.log('Error: ' + e.message);
     *    });
     *
     *    mgr.updateFields({ time: t, phi: phi, theta: theta, color: 'temperature'});
     *
     * Further image handling and drawing is
     * left to other components.
     */
    cinema.utilities.ImageManager = function (params) {
        _.extend(this, Backbone.Events);

        this.visModel = params.visModel;
        this._cache = {};
        this._activeKey = null;

        return this;
    };

    var prototype = cinema.utilities.ImageManager.prototype;

    /**
     * Downloads the image data asynchronously and stores it in the cache for
     * the given key, storing it in the "image" key in the cache entry.
     */
    prototype._downloadImage = function (key) {
        var url = this.visModel.url.substring(0, this.visModel.url.lastIndexOf('/')) + '/' + key,
            img = new Image();

        img.onload = _.bind(function () {
            this._cache[key].image = img;
            this._cache[key].ready = true;
            this.trigger('c:data.ready', this._cache[key]);
        }, this);

        img.onerror = _.bind(function () {
            this.trigger('c:error', {
                'message': 'Error loading image ' + url + ' for key ' + key
            });
        }, this);

        img.src = url;
        if (img.complete) {
            img.onload();
        }
    };

    prototype.getImage = function () {
        if (this._cache[this._activeKey]) {
            return this._cache[this._activeKey].image;
        }
        return null;
    };

    prototype.updateControls = function (controls) {
        var key = this.visModel.getFilePattern(controls);
        this._activeKey = key;

        if (_.has(this._cache, key)) {
            if (this._cache[key].ready) {
                this.trigger('c:data.ready', this._cache[key]);
            }
        }
        else {
            this._cache[key] = {key: key, ready: false};
            this._downloadImage(key);
        }
    };
}) ();
