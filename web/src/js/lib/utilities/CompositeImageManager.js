(function () {
    /**
     * The CompositeImageManager is in charge of actually downloading and
     * caching raw image and compositing data for a given VisualizationModel.
     * Usage example:
     *
     *    var mgr = new cinema.utilities.CompositeImageManager({
     *        visModel: myVisualizationModel
     *    };
     *    mgr.on('c:data.ready', function (payload) {
     *        // compute composited image and draw it ...
     *    }, this).on('c:error', function (e) {
     *        console.log('Error: ' + e.message);
     *    });
     *
     *    mgr.downloadData(t, phi, theta);
     *
     * Further compositing computation and drawing of the composited image is
     * left to other components.
     */
    cinema.utilities.CompositeImageManager = function (params) {
        _.extend(this, Backbone.Events);

        this.visModel = params.visModel;
        this._cache = {};

        if (this.visModel.get('metadata').type !== 'composite-image-stack' &&
            this.visModel.get('metadata').type !== 'composite-image-stack-depth' &&
            this.visModel.get('metadata').type !== 'composite-image-stack-light') {
            throw new Error('Unsupported file format');
        }

        return this;
    };

    var prototype = cinema.utilities.CompositeImageManager.prototype;

    /**
     * Returns the image strip file name from the vis model.
     * The method looks for the following in order:
     *   1. arguments.files.image
     *   2. arguments.filename.default
     * Falls back on rgb.jpg.
     */
    prototype._imageFileName = function () {
        var image, args;

        image = 'rgb.jpg';
        args = this.visModel.get('arguments');
        if (args.files && args.files.image) {
            image = args.files.image;
        } else if (args.filename && args.filename['default']) {
            image = args.filename['default'];
        }
        return image;
    };

    /**
     * Returns the composite info file name from the vis model.
     */
    prototype._compositeInfoFileName = function () {
        var composite, args;

        composite = 'composite.json';
        args = this.visModel.get('arguments');
        if (args.files && args.files.composite) {
            composite = args.files.composite;
        }
        return composite;
    };

    /**
     * Downloads the image data asynchronously and stores it in the cache for
     * the given key, storing it in the "image" key in the cache entry.
     */
    prototype._downloadImage = function (key, viewpoint) {
        var url = this.visModel.url.substring(0, this.visModel.url.lastIndexOf('/')) +
            '/' + key.replace('{filename}', this._imageFileName()),
            img = new Image();

        img.onload = _.bind(function () {
            this._cache[key].image = img;
            if (_.has(this._cache[key], 'json')) {
                this._cache[key].ready = true;
                this.trigger('c:data.ready', this._cache[key], viewpoint);
            }
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

    /**
     * Downloads the composite info file that sits alongside the image,
     * storing its contents in the "json" key in the cache entry.
     */
    prototype._downloadCompositeInfo = function (key, viewpoint) {
        var url = this.visModel.url.substring(0, this.visModel.url.lastIndexOf('/')) +
                  '/' + key.replace('{filename}', this._compositeInfoFileName());

        $.getJSON(url, _.bind(function (data) {
            this._cache[key].json = data;
            if (_.has(this._cache[key], 'image')) {
                this._cache[key].ready = true;
                this.trigger('c:data.ready', this._cache[key], viewpoint);
            }
        }, this)).fail(_.bind(function () {
            this.trigger('c:error', {
                'message': 'Error loading composite JSON file from ' + url
            });
        }, this));
    };

    /**
     * This is the primary public API method of this class. It is responsible
     * for downloading (and internally caching) the requisite image data for
     * the given viewpoint (time/phi/theta combination).
     *
     * @param viewpoint A viewpoint object containing "time", "phi", and
     *                  "theta" keys.
     */
    prototype.downloadData = function (viewpoint) {
        var key = this.visModel.getFilePattern(viewpoint, ['filename']);

        if (_.has(this._cache, key)) {
            if (this._cache[key].ready) {
                this.trigger('c:data.ready', this._cache[key], viewpoint);
            }
        }
        else {
            this._cache[key] = {key: key, ready: false};
            this._downloadImage(key, viewpoint);
            this._downloadCompositeInfo(key, viewpoint);
        }
    };
}) ();
