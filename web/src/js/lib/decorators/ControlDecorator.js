(function () {
   cinema.decorators.Control = function (rootModel) {
      var self = this;
      this.controlMap = {};
      this.controlNames = [];

      function updateData() {
         var args = rootModel.get('arguments');

         self.controlMap = {};
         self.controlNames = [];
         for (var key in args) {
             if (args.hasOwnProperty(key)) {
                 // Store arg
                 self.controlNames.push(key);
                 self.controlMap[key] = args[key];

                 // Find active index
                 var idx = args[key].values.indexOf(args[key]['default']);
                 self.controlMap[key].activeIdx = Number((idx < 0) ? 0 : idx);
             }
         }
      }

      if(rootModel.loaded()) {
         updateData();
      } else {
         rootModel.once('change', updateData);
      }

      return _.extend(rootModel, this);
   };

    var prototype = cinema.decorators.Control.prototype;

    // Public methods ---------------------------------------------------------

    /**
     * Get control value base on its name.
     */
    prototype.getControl = function (name) {
        return this.controlMap[name].values[this.controlMap[name].activeIdx];
    };

    /**
     * Return true if the control exist
     */
    prototype.hasControl = function (name) {
        return this.controlMap.hasOwnProperty(name);
    };

    /**
     * Get control label base on its name.
     */
    prototype.getControlLabel = function (name) {
        return this.controlMap[name].label;
    };

    /**
     * Get control type base on its name.
     */
    prototype.getControlType = function (name) {
        return this.controlMap[name].type;
    };

    /**
     * Get the active index for the given control
     */
    prototype.getControlIndex = function (name) {
        return this.controlMap[name].activeIdx;
    };

    /**
     * Set a new value to a control.
     */
    prototype.setControl = function (name, newValue, trigger) {
        var newIndex = this.controlMap[name].values.indexOf(newValue),
            changed = false;

        if (newIndex !== -1) {
            changed = this.controlMap[name].activeIdx !== newIndex;
            this.controlMap[name].activeIdx = Number(newIndex);
        } else {
            console.error("Can not set " + newValue + " to " + name);
        }
        if (changed && trigger !== false) {
            this.trigger('control-change');
        }
        return changed;
    };

    /**
     * Set multiple control values at once using an object, e.g.
     * {
     *    phi: "...",
     *    theta: "..."
     * }
     */
    prototype.setControls = function (obj) {
        _.each(obj, function (v, k) {
            this.setControl(k, v, false);
        }, this);
        this.trigger('control-change');
    };

    /**
     * Set a new active index to a control.
     */
    prototype.setControlIndex = function (name, idx) {
        var changed = false;

        if (idx >= 0 && idx < this.controlMap[name].values.length) {
            changed = this.controlMap[name].activeIdx !== idx;
            this.controlMap[name].activeIdx = Number(idx);
        } else {
            console.log("index out of range for control " + name);
        }
        if (changed) {
            this.trigger('control-change');
        }
        return changed;
    };

    /**
     * Update the value of a given control to its next discrete value.
     * @param name [string] The name of the control
     * @param wrap [bool] Whether the list is circular
     */
    prototype.incrementControlValue = function (name, wrap) {
        this.controlMap[name].activeIdx = Number(this.controlMap[name].activeIdx) + 1;
        if(this.controlMap[name].activeIdx >= this.controlMap[name].values.length) {
            this.controlMap[name].activeIdx = wrap ? 0 : this.controlMap[name].values.length - 1;
        }

        this.trigger('control-change');
        return this.getControl(name);
    };

    /**
     * Get previous control value base on its name.
     */
    prototype.decrementControlValue = function (name, wrap) {
        var size = this.controlMap[name].values.length;
        this.controlMap[name].activeIdx = Number(this.controlMap[name].activeIdx) - 1;
        if (this.controlMap[name].activeIdx < 0) {
            this.controlMap[name].activeIdx = wrap ? this.controlMap[name].values.length - 1 : 0;
        }

        this.trigger('control-change');
        return this.getControl(name);
    };

    /**
     * Update to the first value for the given control parameter.
     * @param name The field name.
     */
    prototype.setFirstControlValue = function (name) {
        this.controlMap[name].activeIdx = 0;
        this.trigger('control-change');
        return this.getControl(name);
    };

    /**
     * Update to the last value for the given control parameter.
     * @param name The field name.
     */
    prototype.setLastControlValue = function (name) {
        this.controlMap[name].activeIdx = this.controlMap[name].values.length - 1;
        this.trigger('control-change');
        return this.getControl(name);
    };

    /**
     * Get the current controls set.
     */
    prototype.getControls = function () {
        var controls = {},
            count = this.controlNames.length;

        while (count--) { // jshint ignore:line
            var name = this.controlNames[count];
            controls[name] = this.getControl(name);
        }

        return controls;
    };

    /**
     * Get the current controls map which contains values, active index, label and default value.
     */
    prototype.getControlMap = function () {
        return this.controlMap;
    };
}());
