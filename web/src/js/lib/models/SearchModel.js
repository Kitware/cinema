/**
 * This model is used to store the state of a search query, and implements the
 * search filtering logic.
 */
cinema.models.SearchModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.layerModel = settings.layerModel;
        this.visModel = settings.visModel;
        this.query = settings.query || {};
    },

    /**
     * Convert a query string into a query object that can be used to filter
     * results in this model.
     */
    parseQuery: function (str) {
        try {
            var parse_tree = jsep(str);
            this.traverseParseTree(parse_tree);
        } catch (e) {
            return null;
        }
    },

    traverseParseTree: function (tree) {
        var str = "";
        console.log(tree.left, tree.right);
        if (tree.right.right) {
            this.traverseParseTree(tree.right);
        }
        else {
            if (tree.left.type === "Identifier" ) {
                str = str + tree.left.name;
            }
            console.log(tree.left.value,tree.operator,tree.right.value);
        }
    },

    /**
     * This method computes all matching search results, and triggers
     * a 'c:done' event when it has finished.
     */
    compute: function () {
        this.results = [];

        var i;
        for (i = 0; i < this.visModel.imageCount(); i += 1) {
            var viewpoint = this.visModel.ordinalToObject(i);

            if (this._filter(viewpoint)) {
                this.results.push(viewpoint);
            }
        }
        // TODO sort results

        this.trigger('c:done');
    },

    /**
     * Filter a single result based on the current query. Return true if it is a
     * match, false if not.
     */
    _filter: function (viewpoint) {
        return _.every(['phi', 'theta', 'time'], function (field) {
            if (!_.has(this.query, field)) {
                return true;
            }
            return this.query[field].toString() === viewpoint[field];
        }, this);
    }
});
