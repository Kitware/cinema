cinema.models.LayerModel = Backbone.Model.extend({

    constructor: function (defaults, options) {
        Backbone.Model.call(this, {}, options);
        if (typeof defaults === 'string') {
            this.unserialize(defaults);
        } else if (defaults) {
            this.set(defaults);
        }
    },

    /**
     * Convert an object that maps layer identifiers to color-by values into
     * a single string that is consumable by other parts of the application.
     */
    serialize: function () {
        var query = '';

        _.each(this.attributes, function (v, k) {
            query += k + v;
        });

        return query;
    },

    /**
     * Convert a query string to an object that maps layer identifiers to
     * their color-by value. The query string is a sequence of two-character
     * pairs, where the first character identifies the layer ID and the second
     * character identifies which field it should be colored by.
     *
     * The query string is then saved to the model.
     */
    unserialize: function (query) {
        var obj = {};

        if (query.length % 2) {
            return console.error('Query string "' + query + '" has odd length.');
        }

        for (var i = 0; i < query.length; i += 2) {
            obj[query[i]] = query[i + 1];
        }

        return obj;

    },

    /**
     * Set the layers by a "query string".
     */
    setFromString: function (query) {
        var obj = this.unserialize(query);

        this.clear({silent: ! _.isEmpty(obj)});
        this.set(obj);
    }
});
