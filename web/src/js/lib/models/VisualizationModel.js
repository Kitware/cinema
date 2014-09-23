/**
 * Represents a cinema visualization. Stores the required info in the model's
 * attributes.
 */
cinema.models.VisualizationModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.basePath = settings.basePath;
        this.infoFile = settings.infoFile;
        this.url = this.basePath + '/' + this.infoFile;
    },

    defaults: {
    },

    loaded: function () {
        return this.has('metadata');
    },

    url: function () {
        return this.urlRoot + '/' + this.infoFile;
    },

    workbench: function () {
        return false;
    },

    getDataType: function () {
        if(this.loaded()) {
            return this.workbench() ? '' : this.get('metadata').type;
        }
        return 'no-match';
    },

    getFilePattern: function(args, ignoreList) {
        var keySet = args || {},
            result = this.get('name_pattern') || '',
            kp = ['{','}'],
            ignore = ignoreList || [];

        _.each(keySet, function(value, key) {
            if (!_.contains(ignore, key)) {
                result = result.replace(kp.join(key), value);
            }
        });

        return result;
    }
});
