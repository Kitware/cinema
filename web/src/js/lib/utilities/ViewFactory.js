(function () {
    /**
     * The ViewFactory is used to keep track of possible root views
     * that can be created depending on the type of data that you have
     * and the type of the view you care about.
     *
     *    Currently the set of root views available are:
     *     - view
     *     - search
     *     - cost
     *     - generate
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
        this.viewInstances = {};
        return _.extend(this, Backbone.Events);
    };

    var prototype = cinema.utilities.ViewFactory.prototype;

    // Helper methods ---------------------------------------------------------

    function createEmptyView (rootSelector, viewType, model) {
        return {
            controlList: [],
            render: function() {
                $('.c-body-container', $(rootSelector)).html(cinema.app.templates.invalidatePage({view: viewType, data: model.getDataType() }));
            }
        };
    }

    // Public methods ---------------------------------------------------------

    /**
     * Register the constructor method for a given data type and view type.
     * This will allow the factory to delegate the view construction
     * to the registered methods later on when a data exploration will be required.
     *
     * @param dataType The type of the data for which the method is valid for.
     * @param viewType The type of the view for which the method is valid for.
     * @param viewConstructorFunction The function that will be actually called when the view needs to be created.
     */
    prototype.registerView = function (dataType, viewType, viewConstructorFunction) {
        var key = viewType + ':' + dataType;
        this.factoryMap[key] = { "constructor" : viewConstructorFunction };
        return this;
    };

    prototype.render = function (rootSelector, viewType, model) {
        if (model.loaded()) {
            var key = [rootSelector, viewType, model.getDataType()].join(':');

            // Create view if not exist
            if (!this.viewInstances.hasOwnProperty(key) || this.viewInstances[key] === null) {
                this.viewInstances[key] = this.createView(rootSelector, viewType, model);
            }

            // Update the view if it exist
            var view = this.viewInstances[key];
            if(view) {
                view.render();
                return view.controlList;
            } else {
                console.log("no instance for " + key);
            }
        }
        return [];
    };

    prototype.getViewControlList = function (rootSelector, viewType, model) {
        var key = [rootSelector, viewType, model.getDataType()].join(':');

        if(!this.viewInstances.hasOwnProperty(key)) {
            this.viewInstances[key] = this.createView(rootSelector, viewType, model);
        }

        var view = this.viewInstances[key];
        if(view) {
            return view.controlList;
        }

        return [];
    };

    prototype.deleteView = function (rootSelector, viewType, model) {
        var key = [rootSelector, viewType, model.getDataType()].join(':');
        delete this.viewInstances[key];
    };

    /**
     * Create a new view based on the currently loaded model and the provided view type.
     *
     * @param viewPointer The current view object so method can be called on the root view.
     * @param viewType The type of the view that we want to build.
     */
    prototype.createView = function (rootSelector, viewType, model) {
        if (model && model.loaded()) {
            var key = viewType + ':' + model.getDataType();
            if(this.factoryMap.hasOwnProperty(key)) {
                return this.factoryMap[key].constructor(rootSelector, viewType, model);
            } else {
                return createEmptyView(rootSelector, viewType, model);
            }
        }
        return null;
    };

    // Attach object instance to the cinema namespace
    cinema.viewFactory = new cinema.utilities.ViewFactory();
}());
