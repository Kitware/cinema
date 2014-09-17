(function () {
    /**
     * The ViewFactory is used to keep track of possible root views
     * that can be created depending on the type of data that you have
     * and the type of the view you care about.
     *
     *    Currently the set of root views available are:
     *     - RenderView
     *     - SearchView
     *     - PreCostView
     *     - ScriptGenerationView
     *     - RealCostView
     *     - ...
     *
     *    Currently the set of data type that can be handle are:
     *     - composite-data
     *     - composite-data-with-lighting
     *     - image-data
     *     - image-grid-data
     */
    cinema.utilities.ViewFactory = function () {
        this.visModel = null;
        this.factoryMap = {};
        this.compatibilityMap = {};
        return _.extend(this, Backbone.Events);
    };

    var prototype = cinema.utilities.ViewFactory.prototype;

    // Internal helper functions ----------------------------------------------

    function applyCompatibilityMapping(mapToFill, compatibilityMap, dataType, viewType, method ) {
        // FIXME TODO
    }

    // Public methods ---------------------------------------------------------

    /**
     * Register a new VisualizationModel that will then be used
     * for any subsequent view creation.
     *
     * @param newVizModel The current active Visualization Model.
     */
    prototype.updateRootModel = function (newVizModel) {
        this.visModel = newVizModel;

        // Need to trigger event to let the app know that the model is different
        // FIXME TODO
    };

    /**
     * Register the constructor method for a given data type and view type.
     * This will allow the factory to delegate the view construction
     * to the registered methods later on when a data exploration will be required.
     *
     * @param dataType The type of the data for which the method is valid for.
     * @param viewType The type of the view for which the method is valid for.
     * @param method The function that will be actually called when the view needs to be created.
     */
    prototype.registerView = function (dataType, viewType, method) {
        var viewMap = this.factoryMap[viewType] = this.factoryMap[viewType] || {};
        viewMap[dataType] = method;
        console.log('register[' + viewType +'][' + dataType + ']');
        applyCompatibilityMapping(this.factoryMap, this.compatibilityMap, dataType, viewType, method);
        return this;
    };

    /**
     * Create a new view based on the currently loaded model and the provided view type.
     *
     * @param viewPointer The current view object so method can be called on the root view.
     * @param viewType The type of the view that we want to build.
     */
    prototype.createView = function (viewPointer, viewType) {
        console.log('createView[' + viewType +'][' + this.visModel.getDataType() + ']');
        return this.factoryMap[viewType][this.visModel.getDataType()](viewPointer, this.visModel);
    };

    /**
     * Create additional mapping to support old naming convention
     *
     * @param compatibilityMap A map object for which the current naming have change.
     *
     * The map should have the following structure:
     *
     *     {
     *         "dataTypes": {
     *            "composite-data" : [ "rgbz-composite", "composite-image-stack"],
     *            "image-data": [ "image-stack", "basic" ]
     *         },
     *         "viewTypes": {
     *            "RenderView": [ "renderView", "renderview" ],
     *            "SearchView": [ "searchView", "searchview" ]
     *         }
     *     }
     */
    prototype.registerCompatibilityMap = function (compatibilityMap) {
        this.compatibilityMap = compatibilityMap;

        // FIXME TODO => Apply on existing registered data

        return this;
    };

    // Attach object instance to the cinema namespace
    cinema.viewFactory = new cinema.utilities.ViewFactory();
}());
