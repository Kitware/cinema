/**
 * Represents all the fields except the camera location and time.
 */

cinema.models.FieldModel = Backbone.Model.extend({

    constructor: function (options) {
        var args;

        if (!options.info) {
            throw "Info model must be provided in options.";
        }
        this.fieldMap = {};
        this.fieldNames = [];
        this.info = options.info;
        this.listenTo(this.info, 'change', this.setFieldsParameters);
        this.setFieldsParameters();

        Backbone.Model.call(this, {}, options);
    },

    /**
     * Store all available camera angles according to the information model.
     */
    setFieldsParameters: function () {
        var args = this.info.get('arguments');
        if (!this.info.loaded()) {
            return;
        }

        this.fieldMap = {};
        this.fieldNames = [];
        for (var key in args) {
            if (args.hasOwnProperty(key)) {
                // Store arg
                this.fieldNames.push(key);
                this.fieldMap[key] = args[key];

                // Find active index
                var idx = args[key].values.indexOf(args[key]['default']);
                this.fieldMap[key].activeIdx = (idx < 0) ? 0 : idx;
            }
        }
        this.trigger('change');
    },

    /**
     * Get field value base on its name.
     */
    getField: function (name) {
        return this.fieldMap[name].values[this.fieldMap[name].activeIdx];
    },

    /**
     * Return true if the field exist
     */
    hasField: function (name) {
        return this.fieldMap.hasOwnProperty(name);
    },

    /**
     * Get field label base on its name.
     */
    getFieldLabel: function (name) {
        return this.fieldMap[name].label;
    },

    /**
     * Get field type base on its name.
     */
    getFieldType: function (name) {
        return this.fieldMap[name].type;
    },

    /**
     * Get the active index for the given field
     */
    getFieldIndex: function (name) {
        return this.fieldMap[name].activeIdx;
    },

    /**
     * Set a new value to a field.
     */
    setField: function (name, newValue) {
        var newIndex = this.fieldMap[name].values.indexOf(newValue),
            changed = false;
        if (newIndex !== -1) {
            changed = this.fieldMap[name].activeIdx !== newIndex;
            this.fieldMap[name].activeIdx = newIndex;
        } else {
            console.log("Can not set " + newValue + " to " + name);
        }
        if (changed) {
            this.trigger('change');
        }
        return changed;
    },

    /**
     * Set a new active index to a field.
     */
    setFieldIndex: function (name, idx) {
        var changed = false;
        if (idx < this.fieldMap[name].values.length) {
            changed = this.fieldMap[name].activeIdx !== idx;
            this.fieldMap[name].activeIdx = idx;
        } else {
            console.log("index out of range for field " + name);
        }
        if (changed) {
            this.trigger('change');
        }
        return changed;
    },

    /**
     * Get next field value base on its name.
     */
    getNextField: function (name, wrap) {
        this.fieldMap[name].activeIdx = (this.fieldMap[name].activeIdx + 1);
        if (wrap) {
            this.fieldMap[name].activeIdx %= this.fieldMap[name].values.length;
        } else if (this.fieldMap[name].activeIdx >= this.fieldMap[name].values.length) {
            this.fieldMap[name].activeIdx = this.fieldMap[name].values.length - 1;
        }
        this.trigger('change');
        return this.getField(name);
    },

    /**
     * Get previous field value base on its name.
     */
    getPreviousField: function (name, wrap) {
        var size = this.fieldMap[name].values.length;
        this.fieldMap[name].activeIdx -= 1;
        if (this.fieldMap[name].activeIdx < 0) {
            this.fieldMap[name].activeIdx = wrap ? this.fieldMap[name].values.length - 1 : 0;
        }
        this.trigger('change');
        return this.getField(name);
    },

    /**
     * Get first field value base on its name.
     */
    getFirstField: function (name) {
        this.fieldMap[name].activeIdx = 0;
        this.trigger('change');
        return this.getField(name);
    },

    /**
     * Get last field value base on its name.
     */
    getLastField: function (name) {
        this.fieldMap[name].activeIdx = this.fieldMap[name].values.length - 1;
        this.trigger('change');
        return this.getField(name);
    },

    /**
     * Get the current fields set.
     */
    getFields: function () {
        var fields = {},
            count = this.fieldNames.length;

        while (count--) { // jshint ignore:line
            var name = this.fieldNames[count];
            fields[name] = this.getField(name);
        }

        return fields;
    },

    /**
     * Get the current fields map which contains values, active index, label and default value.
     */
    getFieldsMap: function () {
        return this.fieldMap;
    }
});
