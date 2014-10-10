(function () {
    /**
     * The ChartManager is in charge of actually downloading and
     * caching chart JSON data for a given VisualizationModel.
     * Usage example:
     *
     *    var mgr = new cinema.utilities.ChartManager({
     *        visModel: myVisualizationModel
     *    };
     *    mgr.on('c:data.ready', function (payload) {
     *        // chart available draw it ...
     *    }, this).on('c:error', function (e) {
     *        console.log('Error: ' + e.message);
     *    });
     *
     *    mgr.updateFields({ time: t, ...});
     *
     * Further chart handling and drawing is
     * left to other components.
     */
    cinema.utilities.ChartManager = function (params) {
        _.extend(this, Backbone.Events);

        this.visModel = params.visModel;
        this._cache = {};
        this._activeKey = null;

        return this;
    };

    var prototype = cinema.utilities.ChartManager.prototype;

    /**
     * Downloads the chart JSON data asynchronously and stores it in the cache for
     * the given key, storing it in the "chart" key in the cache entry.
     */
    prototype._downloadChart = function (key) {
        var url = this.visModel.url.substring(0, this.visModel.url.lastIndexOf('/')) + '/' + key,
            that = this;

        $.getJSON(url)
        .done(function(data) {
            that._cache[key] = data;
            that.trigger('c:data.ready', that._cache[key]);
        })
        .fail(function(error) {
            console.log( "error" );
            that.trigger('c:error', {
                'message': 'Error loading json data ' + url + ' for key ' + key
            });
        });
    };

    prototype.getData = function () {
        if (this._cache[this._activeKey]) {
            return this._cache[this._activeKey];
        }
        return null;
    };

    prototype.updateControls = function (controls) {
        var key = this.visModel.getFilePattern(controls);
        this._activeKey = key;

        if (_.has(this._cache, key)) {
            if (this._cache[key]) {
                this.trigger('c:data.ready', this._cache[key]);
            }
        }
        else {
            this._cache[key] = null;
            this._downloadChart(key);
        }
    };
}) ();
