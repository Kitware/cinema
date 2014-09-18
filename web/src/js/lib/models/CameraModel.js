/**
 * Represents a camera location (in space and time).
 */

cinema.models.CameraModel = Backbone.Model.extend({
    /**
     * Model attributes are the indices in the arrays of valid camera parameters.
     * Users of the model should not access these directly.
     */
    defaults: {
        iphi: 0,
        itheta: 0,
        itime: 0,
        zoom: 1,
        center: [0, 0]
    },

    constructor: function (options) {
        var args;

        if (!options.info) {
            throw "Info model must be provided in options.";
        }
        this.info = options.info;
        this.listenTo(this.info, 'change', this.setCameraParameters);
        this.setCameraParameters();

        Backbone.Model.call(this, {}, options);
    },

    /**
     * Store all available camera angles according to the information model.
     */
    setCameraParameters: function () {

        var args = this.info.get('arguments');
        if (!this.info.loaded()) {
            // info model not yet loaded
            this.phis = [];
            this.thetas = [];
            this.times = [];
            return;
        }

        _.each(['phi', 'theta', 'time'], function (param) {
            var idx;
            this[param + 's'] = args[param].values;
            if (_.has(args[param], 'default')) {
                idx = args[param].values.indexOf(args[param]['default']);
                if (idx < 0) {
                    throw "'" + param + "' has an invalid default.";
                }
                this.defaults['i' + param] = idx;
            }
        }, this);
    },

    /**
     * Get the current camera location and time.
     */
    phi: function () {
        return this.phis[this.get('iphi')];
    },

    theta: function () {
        return this.thetas[this.get('itheta')];
    },

    time: function () {
        return this.times[this.get('itime')];
    },

    center: function () {
        return this.get('center').slice();
    },

    /**
     * Increment the given camera parameter to the next
     * valid value optionally wrapping around the start and end.
     */
    increment: function (param, byValue, wrap) {
        var idx, value, n;

        if (param === 'center') {
            if (!byValue) {
                return this;
            }
            value = this.get('center');
            this.set('center', [value[0] + byValue[0], value[1] + byValue[1]]);
        } else {
            wrap = !!wrap;
            byValue = byValue || 1;
            n = this[param + 's'].length;

            idx = this.get('i' + param) + byValue;

            if (wrap) {
                idx = (idx + n) % n;
            }

            if (idx >= 0 && idx < n) {
                this.set('i' + param, idx);
            } /* else throw error? clamp to valid bounds? */
        }
        return this;
    },

    /**
     * Get delta between adjacent values for the given parameter
     */
    delta: function (param) {
        var values = this[param + 's'];
        if (values.length <= 1) {
            return 0;
        }
        return values[1] - values[0];
    }
});
