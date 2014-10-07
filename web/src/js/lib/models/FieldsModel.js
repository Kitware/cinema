/**
 * Represents all of the value type fields that we can do dynamic rendering on.
 */

cinema.models.FieldsModel = Backbone.Model.extend({

    constructor: function (options) {
        this.compositeModel = options.compositeModel;

        Backbone.Model.call(this, {}, options);

        this.fields = {};
        //find all of the value fields arrays and make a LUT for each of them
        for (var key in this.compositeModel.attributes.metadata.ranges) {
            if (this.compositeModel.attributes.metadata.ranges.hasOwnProperty(key)) {
                this.fields[key] = this.compositeModel.attributes.metadata.ranges[key];
            }
        }
    }

});
