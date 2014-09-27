/**
 * Represents a cinema rendering options. Stores the required info in the model's
 * attributes.
 */
cinema.models.RenderingModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.url = settings.url;
    },

    defaults: {
    },

    loaded: function () {
        return this.has('swatches');
    },

    url: function () {
        return this.url;
    },

    getData: function (name) {
        if(this.loaded()) {
            return this.get(name);
        }
        return 'no-match';
    },

    getLookupTableFunction: function (name) {
        var table =  this.get('lookuptables')[name].table;

        function lut(value) {
            return table[Math.floor(value * 255)];
        }

        return lut;
    },

    _invalidateTable: function (name) {

    }
});
