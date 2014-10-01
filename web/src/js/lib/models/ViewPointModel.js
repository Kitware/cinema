/**
 * Represents a 2D view point with additional view related fields.
 */

cinema.models.ViewPointModel = Backbone.Model.extend({
    defaults: {
        zoom: 1,
        center: [0, 0]
    },

    constructor: function (options) {
        this.controlModel = options.controlModel;
        Backbone.Model.call(this, {}, options);
    },

    center: function () {
        return this.get('center').slice();
    },

    /**
     * Increment the given camera parameter to the next
     * valid value optionally wrapping around the start and end.
     */
    increment: function (name, byValue, wrap) {
        var idx, value, n;

        if (name === 'center') {
            if (!byValue) {
                return this;
            }
            value = this.get('center');
            this.set('center', [value[0] + byValue[0], value[1] + byValue[1]]);
        } else if (this.controlModel && this.controlModel.hasControl(name)) {
            wrap = !!wrap;
            byValue = byValue || 1;
            if (byValue > 0) {
                this.controlModel.incrementControlValue(name, wrap);
            } else {
                this.controlModel.decrementControlValue(name, wrap);
            }
        }
        return this;
    },

    /**
     * Get delta between adjacent values for the given parameter
     */
    delta: function (param) {
        return 20;
    }
});
