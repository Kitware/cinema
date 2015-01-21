/**
 * Represents all the controls.
 */

cinema.models.ControlModel = Backbone.Model.extend({

    constructor: function (options) {
        var args;

        if (!options.info) {
            throw "Info model must be provided in options.";
        }
        this.controlMap = {};
        this.controlNames = [];
        this.info = options.info;
        this.listenTo(this.info, 'change', this.setControlsParameters);
        this.setControlsParameters();

        Backbone.Model.call(this, {}, options);
    },

    setControlsParameters: function () {
        var args = this.info.get('arguments');
        if (!this.info.loaded()) {
            return;
        }

        this.controlMap = {};
        this.controlNames = [];
        for (var key in args) {
            if (args.hasOwnProperty(key)) {
                // Store arg
                this.controlNames.push(key);
                this.controlMap[key] = args[key];

                // Find active index
                var idx = args[key].values.indexOf(args[key]['default']);
                this.controlMap[key].activeIdx = (idx < 0) ? 0 : idx;
            }
        }
        this.trigger('change');
    },

    /**
     * Get control value based on its name.
     */
    getControl: function (name) {
        return this.controlMap[name].values[this.controlMap[name].activeIdx];
    },

    /**
     * Return true if the control exist
     */
    hasControl: function (name) {
        return this.controlMap.hasOwnProperty(name);
    },

    /**
     * Get control label based on its name.
     */
    getControlLabel: function (name) {
        return this.controlMap[name].label;
    },

    /**
     * Get control type based on its name.
     */
    getControlType: function (name) {
        return this.controlMap[name].type;
    },

    /**
     * Get the active index for the given control
     */
    getControlIndex: function (name) {
        return this.controlMap[name].activeIdx;
    },

    /**
     * Set a new value to a control.
     */
    setControl: function (name, newValue, trigger) {
        var newIndex = this.controlMap[name].values.indexOf(newValue),
            changed = false;
        if (newIndex !== -1) {
            changed = this.controlMap[name].activeIdx !== newIndex;
            this.controlMap[name].activeIdx = newIndex;
        } else {
            console.error("Can not set " + newValue + " to " + name);
        }
        if (changed && trigger !== false) {
            this.trigger('change');
        }
        return changed;
    },

    /**
     * Set multiple control values at once using an object, e.g.
     * {
     *    phi: "...",
     *    theta: "..."
     * }
     */
    setControls: function (obj) {
        _.each(obj, function (v, k) {
            this.setControl(k, v, false);
        }, this);
        this.trigger('change');
    },

    /**
     * Set a new active index to a control.
     */
    setControlIndex: function (name, idx) {
        var changed = false;
        if (idx < this.controlMap[name].values.length) {
            changed = this.controlMap[name].activeIdx !== idx;
            this.controlMap[name].activeIdx = idx;
        } else {
            console.log("index out of range for control " + name);
        }
        if (changed) {
            this.trigger('change');
        }
        return changed;
    },

    /**
     * Update the value of a given control to its next discrete value.
     * @param name [string] The name of the control
     * @param wrap [bool] Whether the list is circular
     */
    incrementControlValue: function (name, wrap) {
        this.controlMap[name].activeIdx = Number(this.controlMap[name].activeIdx) + 1;
        if(this.controlMap[name].activeIdx >= this.controlMap[name].values.length) {
            this.controlMap[name].activeIdx = wrap ? 0 : this.controlMap[name].values.length - 1;
        }

        this.trigger('change');
        return this.getControl(name);
    },

    /**
     * Get previous control value base on its name.
     */
    decrementControlValue: function (name, wrap) {
        var size = this.controlMap[name].values.length;
        this.controlMap[name].activeIdx -= 1;
        if (this.controlMap[name].activeIdx < 0) {
            this.controlMap[name].activeIdx = wrap ? this.controlMap[name].values.length - 1 : 0;
        }
        this.trigger('change');
        return this.getControl(name);
    },

    /**
     * Update to the first value for the given control parameter.
     * @param name The field name.
     */
    setFirstControlValue: function (name) {
        this.controlMap[name].activeIdx = 0;
        this.trigger('change');
        return this.getControl(name);
    },

    /**
     * Update to the last value for the given control parameter.
     * @param name The field name.
     */
    setLastControlValue: function (name) {
        this.controlMap[name].activeIdx = this.controlMap[name].values.length - 1;
        this.trigger('change');
        return this.getControl(name);
    },

    /**
     *
     */
    startPlay: function (name) {
        if (this.controlMap[name].activeIdx < this.controlMap[name].values.length - 1) {
            this.incrementControlValue(name, false);
            setTimeout(function(caller, name) {
                caller.startPlay(name);
            }, 500, this, name);
        }
    },

    /**
     * Get the current controls set.
     */
    getControls: function () {
        var controls = {},
            count = this.controlNames.length;

        while (count--) { // jshint ignore:line
            var name = this.controlNames[count];
            controls[name] = this.getControl(name);
        }

        return controls;
    },

    /**
     * Get the current controls map which contains values, active index, label and default value.
     */
    getControlMap: function () {
        return this.controlMap;
    }
});
