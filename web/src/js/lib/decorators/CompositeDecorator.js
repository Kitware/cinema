(function () {
    cinema.decorators.Composite = function (rootModel) {
        this.colorByRanges = {};
        this.colorByFields = [];
        this.fieldCodesToNames = {};
        this.fieldNamesToCodes = {};

        this.initializeFieldsAndRanges(rootModel);

        return _.extend(rootModel, this);
    };

    var prototype = cinema.decorators.Composite.prototype;

    // Private methods

    prototype.initializeFieldsAndRanges = function (visModel) {
        // First create the bi-directional maps we need to/from field name and field code
        if (_.has(visModel.attributes.metadata, 'fields')){
            var fieldMap = visModel.attributes.metadata.fields;
            for (var fieldCode in fieldMap) {
                if (_.has(fieldMap, fieldCode)) {
                    var fieldName = fieldMap[fieldCode];
                    this.fieldCodesToNames[fieldCode] = fieldName;
                    this.fieldNamesToCodes[fieldName] = fieldCode;
                }
            }
        }

        // Next create the list of fields we can color by
        var colorByMap = null;

        if (_.has(visModel.attributes.metadata, 'layer_color_by')) {
            colorByMap = visModel.attributes.metadata.layer_color_by;
        } else if (_.has(visModel.attributes.metadata, 'layer_fields')) {
            colorByMap = visModel.attributes.metadata.layer_fields;
        }

        var allcbs = [];

        for (var layer in colorByMap) {
            if (_.has(colorByMap, layer)) {
                allcbs.push(colorByMap[layer]);
            }
        }

        var self = this;
        var regex = /[,\[\]]/;
        var uniqueCodes = _.union.apply(_, allcbs);

        // Convert all field codes to names
        this.colorByFields = _.map(uniqueCodes, function(code) {
            return self.fieldCodesToNames[code];
        });

        // Filter out the uglies
        this.colorByFields = _.filter(this.colorByFields, function(listElt) {
            return regex.exec(listElt) === null;
        });

        // Finally create the map of colorby field names to their ranges
        if (_.has(visModel.attributes.metadata, 'ranges')) {
            var rangeMap = visModel.attributes.metadata.ranges;
            for (var fName in rangeMap) {
                if (_.has(rangeMap, fName)) {
                    this.colorByRanges[fName] = rangeMap[fName];
                }
            }
        }
    };

    // Public methods ---------------------------------------------------------

    prototype.getColorByFields = function () {
        return this.colorByFields;
    };

    prototype.getColorByRanges = function () {
        return this.colorByRanges;
    };

    prototype.getFieldName = function (fieldCode) {
        return this.fieldCodesToNames[fieldCode];
    };

    prototype.getFieldCode = function (fieldName) {
        return this.fieldNamesToCodes[fieldName];
    };

    prototype.getSpriteSize = function () {
        if (!this._spriteSize) {
            this._spriteSize = 0;
            var that = this;
            _.each(this.getOffset(), function(value, key) {
                that._spriteSize = (that._spriteSize < value) ? value : that._spriteSize;
            });
        }
        return this._spriteSize;
    };

    prototype.getOffset = function () {
        return this.get('metadata').offset;
    };

    prototype.getImageSize = function () {
        return this.get('metadata').dimensions;
    };

    prototype.getSpriteImageSize = function () {
        var baseSize = this.getImageSize();
        return [ baseSize[0], baseSize[1] * this.getSpriteSize() ];
    };

    prototype.getDefaultPipelineSetup = function () {
        // Not stored currently in data model
        if (_.has(this.get('metadata'), 'default_pipeline')) {
            return this.get('metadata').default_pipeline;
        }

        var layers = this.get('metadata').layers;
        var layerFields = this.get('metadata').layer_fields;

        var pipeline = '';
        for (var idx = 0; idx < layers.length; idx += 1) {
            var fieldsForLayer = layerFields[layers[idx]];
            pipeline += layers[idx];
            pipeline += fieldsForLayer[0];
        }

        return pipeline;
    };
}());
