(function () {
    /**
     * The ViewMapper is used to keep track of possible root views
     * that can be created depending on the type of visualization that you have
     * and the mode you want to view it in.
     */
    cinema.utilities.ViewMapper = function () {
        this._viewMap = {};
        return this;
    };

    var prototype = cinema.utilities.ViewMapper.prototype;

    /**
     * Register a top-level view with the map.
     *
     * @param type The vis type, e.g. "parametric-image-stack"
     * @param mode A viewing mode for this type, e.g. "search" or "view". Part of
     *             the route for this top-level view.
     * @param view A Backbone.View prototype to render for this type/mode combination.
     * @param opts An object with the following optional keys:
     *   [controls]: An ordered list of control specification objects.
     */
    prototype.registerView = function (type, mode, view, opts) {
        if (!_.has(this._viewMap, type)) {
            this._viewMap[type] = {};
        }

        this._viewMap[type][mode] = {
            view: view,
            opts: opts || {}
        };
        return this;
    };

    /**
     * Returns the view and options object corresponding to the given type and mode,
     * or null if none has been registered. The returned object will have a "view"
     * key representing the view prototype to use, and an "opts" key containing any
     * options that the view was registered with.
     *
     * @param type The vis type, e.g. "parametric-image-stack"
     * @param mode A viewing mode for the vis type, e.g. "search" or "view".
     */
    prototype.getView = function (type, mode) {
        if (!_.has(this._viewMap, type)) {
            console.log('Unregistered view type "' + type + '".');
            return null;
        }
        if (!_.has(this._viewMap[type], mode)) {
            console.log('Unregistered view mode "' + mode + '" for type "' + type +'".');
            return null;
        }
        return this._viewMap[type][mode];
    };
}());

cinema.viewMapper = new cinema.utilities.ViewMapper();
