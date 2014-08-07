(function () {
    /**
     * The CompositeImageManager is in charge of actually downloading and
     * caching image data for a given VisualizationModel. Usage:
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
     */
    cinema.utilities.CompositeImageManager = function (params) {
        var args = params.visModel.get('arguments');

        _.extend(this, Backbone.Events);

        this.visModel = params.visModel;
        this.imageFileName = params.imageFileName || 'rgb.jpg';
        this.compositeInfoFileName = params.compositeInfoFileName || 'composite.json';
        this._cache = {};
        this.updateFields(args.time.default, args.phi.default, args.theta.default);

        return this;
    };

    var prototype = cinema.utilities.CompositeImageManager.prototype;

    /**
     * Helper method to transform phi, theta, and time into a path.
     */
    prototype._getDataPath = function (time, phi, theta) {
        return this.visModel.get('name_pattern').replace('{time}', time)
                                                .replace('{phi}', phi)
                                                .replace('{theta}', theta);
    };

    /**
     * Downloads the image data asynchronously and stores it in the cache for
     * the given key, storing it in the "image" key in the cache entry.
     */
    prototype._downloadImage = function (key) {
        var url = this.visModel.url.substring(0, this.visModel.url.lastIndexOf('/')) +
                  '/' + key.replace('{filename}', this.imageFileName),
            img = new Image();

            img.onLoad = _.bind(function () {
                this._cache[key]['image'] = img;
                if (_.has(this._cache[key], 'json')) {
                    this.trigger('c:data.ready', this._cache[key]);
                }
            }, this);

            img.onError = _.bind(function () {
                this.trigger('c:error', {
                    'message': 'Error loading image ' + url + ' for key ' + key
                });
            }, this);

            img.src = url;
            if (img.complete) {
                img.onLoad();
            }
    };

    /**
     * Downloads the composite info file that sits alongside the image,
     * storing its contents in the "json" key in the cache entry.
     */
    prototype._downloadCompositeInfo = function (key) {
        var url = this.visModel.url.substring(0, this.visModel.url.lastIndexOf('/')) +
                  '/' + key.replace('{filename}', this.compositeInfoFileName);

        $.getJSON(url, _.bind(function (data) {
            this._cache[key]['json'] = data;
            if (_.has(this._cache[key], 'image')) {
                this.trigger('c:data.ready', this._cache[key]);
            }
        }, this)).fail(_.bind(function () {
            this.trigger('c:error', {
                'message': 'Error loading composite JSON file from ' + url
            });
        }, this));
    };

    prototype.updateFields = function (time, phi, theta) {
        var key = this._getDataPath(time, phi, theta);

        if (_.has(this._cache, key)) {
            this.trigger('c:data.ready', this._cache[key]);
        }
        else {
            this._cache[key] = {};
            this._downloadImage(key);
            this._downloadCompositeInfo(key);
        }
    };
}) ();
