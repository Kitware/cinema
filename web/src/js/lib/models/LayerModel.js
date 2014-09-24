cinema.models.LayerModel = Backbone.Model.extend({

    constructor: function (defaults, options) {

        this.info = options.info;

        // Maintains a record of layers and directories and their color/state in the
        // controls.  This is mainly here to cache previous states so that when
        // layers are hidden/closed or shown/opened they return back to the previous state.
        // The value of each key is an object:
        //
        //   {
        //     'color':  // the last displayed (or default) color state
        //     'hidden': // true, if shown in controls, but not rendered
        //     'closed': // true, if not shown in controls and not rendered
        //     'children': [] // if this is a directory, then contains the child state objects
        //   }
        this._controlStates = {};

        Backbone.Model.call(this, {}, options);
        if (typeof defaults === 'string') {
            this.setFromString(defaults);
        } else if (defaults) {
            this.set('state', defaults);
        }

        this.listenTo(this.info, 'change', this.setLayersParameters);
        this.setLayersParameters();
    },

    /**
     * Create defaults
     */
    defaults: {
        state: {} // Rendered layer -> color mapping
    },

    /**
     * Set information/defaults from the visualization layer once it is loaded.
     */
    setLayersParameters: function () {
        if (!this.info.loaded()) {
            return;
        }

        var pipeline = this.info.get('metadata').pipeline,
            state = this.get('state'),
            layerFields = this.info.get('metadata').layer_fields,
            iDirectory = 0;

        var processLayer = function (layer) {
            var id = layer.ids[0], layerObj;

            // If the layer object exists, then use it
            // or get a new one.
            layerObj = this._controlStates[id] || {
                children: {},
                hidden: true,
                closed: false,
                color: layerFields[id][0] // Default color-by set here
            };
            if (_.has(state, id)) {
                layerObj.hidden = false;
                layerObj.color = state.id;
            }
            this._controlStates[id] = layerObj;
            return layerObj;
        }.bind(this);

        // go through each item in the pipeline and add default states and colors
        // for each layer and directory
        pipeline.forEach(function (obj) {
            var children, visibleChild = false;

            if (obj.type === 'layer') {
                processLayer(obj);
            } else {
                children = {};

                // support nested directories?
                obj.children.forEach(function (child) {
                    var childObj = processLayer(child);
                    children[child.ids[0]] = childObj;
                    visibleChild = visibleChild || !childObj.hidden;
                });

                // add directory to the control states
                this._controlStates[this._directoryId(iDirectory)] = {
                    children: children,
                    hidden: !visibleChild,
                    closed: false,
                    color: null
                };
            }
            iDirectory += 1;
        }.bind(this));
    },

    /**
     * Returns a string id for directory number `idx` as it is represented in the
     * _controlStates object.  Meant to prevent collisions with layer id's.
     */
    _directoryId: function (idx) {
        return 'directory' + idx.toFixed();
    },

    /**
     * Open/close/hide/show a layer or directory.
     *
     * method: 'hidden' or 'closed'
     * value: true or false
     *
     * Sets the layer or directory hidden or closed status to value.  Modifying the
     * data state when done.
     */
    _modifyControlCache: function (id, method, value, silent) {
        var obj, state = this.get('state');

        if (typeof id === 'number') {
            id = this._directoryId(id);
        }
        this._controlStates[id][method] = value;

        // Propagate to any children
        _.each(this._controlStates[id].children, function (child, id) {
            child[method] = value;
        });

        this._updateState();
    },

    /**
     * Set the model state according to the control state.
     */
    _updateState: function () {
        var state = {};
        _.each(this._controlStates, function (value, key) {
            if (_.isEmpty(value.children) &&
                !value.hidden &&
                !value.closed) {
                state[key] = value.color;
            }
        });
        this.set({'state': state}, {'silent': true});
        this.trigger('change');
    },

    /**
     * Open a layer or directory.  If the id parameter is a number, then
     * it is interpreted as a directory id, otherwise it is interpreted
     * as a layer id.
     */
    open: function (id, silent) {
        this._modifyControlCache(id, 'closed', false, silent);
    },

    /**
     * Close a layer or directory.  If the id parameter is a number, then
     * it is interpreted as a directory id, otherwise it is interpreted
     * as a layer id.
     */
    close: function (id, silent) {
        this._modifyControlCache(id, 'closed', true, silent);
    },

    /**
     * Hide a layer or directory.  If the id parameter is a number, then
     * it is interpreted as a directory id, otherwise it is interpreted
     * as a layer id.
     */
    hide: function (id, silent) {
        this._modifyControlCache(id, 'hidden', true, silent);
    },

    /**
     * Show a layer or directory.  If the id parameter is a number, then
     * it is interpreted as a directory id, otherwise it is interpreted
     * as a layer id.
     */
    show: function (id, silent) {
        this._modifyControlCache(id, 'hidden', false, silent);
    },

    /**
     * Return the status of a layer or directory.
     * Returns:
     *   * 'rendered': it is rendered on the canvas
     *   * 'hidden': it is shown in the controls but not rendered
     *   * 'closed': it is not shown in controls or the canvas
     */
    status: function (id) {
        var obj, rval;

        if (typeof id === 'number') {
            id = this._directoryId(id);
        }
        obj = this._controlStates[id];
        if (obj.closed) {
            rval = 'closed';
        } else if (obj.hidden) {
            rval = 'hidden';
        } else {
            rval = 'rendered';
        }

        return rval;
    },

    /**
     * Gets/sets the cached (or current) color by value for a directory or layer.
     */
    color: function (id, value) {
        if (typeof id === 'number') {
            id = this._directoryId(id);
        }

        if (value === undefined) {
            return this._controlStates[id].color;
        } else {
            this._controlStates[id].color = value;
            _.each(this._controlStates[id].children, function (child) {
                child.color = value;
            });
            this._updateState();
        }
    },

    /**
     * Overloaded Model.get method that copies the state object rather than
     * returning a reference.  Users should not be able to silently mutate
     * the state.
     */
    get: function (arg) {
        var value = Backbone.Model.prototype.get.apply(this, arguments);
        if (arg === 'state') {
            value = _.extend({}, value);
        }
        return value;
    },

    /**
     * Overloaded Model.set method that caches colors and updates hidden and
     * closed values as needed.
     */
    set: function (arg1, arg2, arg3) {
        if (typeof arg1 === 'string') {
            return this.set({arg1: arg2}, arg3);
        }

        if (arg1.state !== undefined) {
            _.each(arg1.state, function (color, layerId) {
                this._controlStates[layerId].hidden = false;
                this._controlStates[layerId].closed = false;
                this._controlStates[layerId].color = color;
            }.bind(this));
        }
        return Backbone.Model.prototype.set.apply(this, arguments);
    },

    /**
     * Convert an object that maps layer identifiers to color-by values into
     * a single string that is consumable by other parts of the application.
     */
    serialize: function () {
        var query = '';

        _.each(this.get('state'), function (v, k) {
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

        this.set('state', obj);
    }
});
