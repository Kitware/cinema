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
            console.log(parse_tree);
            this.traverseParseTree(parse_tree);
        } catch (e) {
            return null;
        }
    },

    traverseParseTree: function (tree) {
        var str = "";
        if (tree.left) {
            this.traverseParseTree(tree.left);
        }
        if (tree.type === "UnaryExpression") {
            if (tree.operator != "!") {
                console.log("Unsupported unary expession in query!")
            }
            else {
                str = str + tree.operator;
                console.log(str);
                this.traverseParseTree(tree.argument);
            }
        }
        else if (tree.type === "LogicalExpression") {
            if (tree.left.left) {
                str = str + tree.operator;
                console.log(str);
            }
            else {
                if (tree.left.type === "Identifier") {
                    str = str + tree.left.name;
                }
                else if (tree.left.type === "Literal") {
                    str = str + tree.left.raw;
                }
                str = str + tree.operator;
                if (tree.right.type === "Identifier") {
                    str = str + tree.right.name;
                }
                else if (tree.right.type === "Literal") {
                    str = str + tree.right.raw;
                }
                console.log(str);
            }

        }
        else if (tree.type === "BinaryExpression") {
            if (tree.left.left) {
                str = str + tree.operator;
                console.log(str);
            }
            else {
                if (tree.operator == "==") {

                }
                if (tree.left.type === "Identifier") {
                    str = str + tree.left.name;
                }
                else if (tree.left.type === "Literal") {
                    str = str + tree.left.raw;
                }
                str = str + tree.operator;
                if (tree.right.type === "Identifier") {
                    str = str + tree.right.name;
                }
                else if (tree.right.type === "Literal") {
                    str = str + tree.right.raw;
                }
                console.log(str);
            }

        }
        if (tree.right) {
            this.traverseParseTree(tree.right);
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
