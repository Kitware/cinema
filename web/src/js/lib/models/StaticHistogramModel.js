/**
 * This model holds the histogram data for a particular layer combination.
 */
cinema.models.StaticHistogramModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.namePattern = settings.namePattern;
        this.analysisInfo = settings.analysisInfo;
        this.relativePath = this.analysisInfo.relativePath;
        this.fileName = this.analysisInfo.filename;
        this.basePath = settings.basePath + '/' + this.relativePath;

        this.layerComponents = [];
        this.layerEncodingMap = {};

        this.buildStaticHistogramMap();
    },

    buildStaticHistogramMap: function() {
        var ignoreComponents = ['time', 'phi', 'theta'];
        var regex = /{([^}]+)}/g;

        var m = regex.exec(this.namePattern);

        while (m) {
            if (!_.contains(ignoreComponents, m[1])) {
                this.layerComponents.push(m[1]);
            }
            m = regex.exec(this.namePattern);
        }

        for (var i = 0; i < this.analysisInfo.information.length; i+=1) {
            var info = this.analysisInfo.information[i];
            var name = info.name;
            this.layerEncodingMap[name] = {};
            for (var j = 0; j < info.mappings.length; j+=1) {
                var mapping = info.mappings[j];
                this.layerEncodingMap[name][mapping.value] = mapping.code;
            }
        }
    },

    fetch: function (options) {
        var controlMap = options.controlModel.controlMap;
        var layerCodeElts = [];

        for (var idx = 0; idx < this.layerComponents.length; idx += 1) {
            var lName = this.layerComponents[idx];
            var controlElement = controlMap[lName];
            var lValue = controlElement.values[parseInt(controlElement.activeIdx)];
            layerCodeElts.push(this.layerEncodingMap[lName][lValue]);
        }

        var layerCodeString = layerCodeElts.join('-');
        this.url = this.basePath + '/' + layerCodeString + '/' + this.fileName;

        return Backbone.Model.prototype.fetch.apply(this, arguments);
    },

    loaded: function () {
        return this.has('images');
    },

    getData: function (name) {
        if(this.loaded()) {
            return this.get(name);
        }
        return 'no-match';
    }
});
