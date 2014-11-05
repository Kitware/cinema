(function () {
var sharedDataMap = {},
    visibilityMap = { 'histogram': false, 'information': false };


    var getSharedData = function (model, container) {
        if (sharedDataMap.hasOwnProperty(model.getHash())) {
            return sharedDataMap[model.getHash()];
        } else {
            var layer = new cinema.models.LayerModel(model.getDefaultPipelineSetup(), { info: model }),
                control = new cinema.models.ControlModel({
                    info: model
                }),
                histogram = new cinema.models.CompositeHistogramModel({
                    layerModel: layer,
                    basePath: model.get('basePath'),
                    analysisInfo: model.attributes.metadata.analysis
                }),
                viewpoint = new cinema.models.ViewPointModel({
                    controlModel: control
                }),
                informationWidget = new cinema.views.SearchInformationWidget({
                    el: $('.c-information-panel', container),
                    model: model,
                    controlModel: control,
                    exclude: ['layer', 'filename'],
                    layers: layer,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                histogramWidget = new cinema.views.CompositeHistogramWidget({
                    el: $('.c-histogram-panel', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogram,
                    viewpoint: viewpoint,
                    layerModel: layer,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                compositeToolsWidget = new cinema.views.CompositeToolsWidget({
                    el: $('.c-tools-panel', container),
                    model: model,
                    controlModel: control,
                    viewpoint: viewpoint,
                    layers: layer,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                searchToolsWidget = new cinema.views.SearchToolsWidget({
                    el: $('.c-tools-panel', container),
                    model: model,
                    layers: layer,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                imageManager = new cinema.utilities.CompositeImageManager({
                    visModel: model
                }),
                renderView = new cinema.views.VisualizationCanvasWidget({
                    el: this.$('.c-body-container', container),
                    model: model,
                    layers: layer,
                    controls: control,
                    viewpoint: viewpoint,
                    compositeManager: imageManager
                }),
                searchView = new cinema.views.CompositeSearchPage({
                    el: $('.c-body-container', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogram,
                    visModel: model,
                    layerModel: layer
                }),
                shared = {
                    control: control,
                    histogram: histogram,
                    layer: layer,
                    viewpoint: viewpoint,
                    informationWidget: informationWidget,
                    histogramWidget: histogramWidget,
                    compositeToolsWidget: compositeToolsWidget,
                    searchToolsWidget: searchToolsWidget,
                    imageManager: imageManager,
                    renderView: renderView,
                    searchView: searchView
                };
            sharedDataMap[model.getHash()] = shared;
            return shared;
        }
    };

    var visibility = function (name, value) {
        if (value === undefined) {
            return visibilityMap[name];
        } else {
            visibilityMap[name] = value;
        }
    };

    cinema.events.on('toggle-control-panel', function(event) {
        visibility(event.key, event.visible);
    });

    cinema.views.CompositeView = Backbone.View.extend({
        initialize: function (opts) {
            this.compositeModel = new cinema.decorators.Composite(this.model);
            var sharedData = getSharedData(this.compositeModel, this.$el);

            this.compositeManager = sharedData.imageManager;
            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.layers = sharedData.layer;
            this.renderView = sharedData.renderView;

            new cinema.utilities.RenderViewMouseInteractor({
                    renderView: this.renderView,
                    camera: this.viewpointModel
                }).enableMouseWheelZoom({
                    maxZoomLevel: 10,
                    zoomIncrement: 0.05,
                    invertControl: false
                }).enableDragPan({
                    keyModifiers: cinema.keyModifiers.SHIFT
                }).enableDragRotation({
                    keyModifiers: null
                });

            this.compositeTools = sharedData.compositeToolsWidget;

            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            if (this._hasAnalysis) {
                this.histogramModel = sharedData.histogram;
                this.controlList = opts.defaultControls.slice(0);
                this.compositeHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList.push(
                    { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                    { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );
            }

            this.controlModel.on('change', this.refreshCamera, this);
            this.viewpointModel.on('change', this.refreshCamera, this);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            this.renderView.setElement(this.$('.c-body-container')).render().showViewpoint();
            this.compositeTools.setElement(this.$('.c-tools-panel')).render();
            if (this._hasAnalysis) {
                this.compositeHistogram.setElement(this.$('.c-histogram-panel')).render();
                this.searchInformation.setElement(this.$('.c-information-panel')).render();
                this.$('.c-histogram-panel').toggle(visibility('histogram'));
                this.$('.c-information-panel').toggle(visibility('information'));
            }

            return this;
        },

        refreshCamera: function () {
            if (this.renderView) {
                this.renderView.showViewpoint();
            }
        },

        resetCamera: function () {
            if (this.renderView) {
                this.renderView.showViewpoint();
                this.renderView.resetCamera();
            }
        }
    });

    cinema.views.CompositeSearchView = Backbone.View.extend({
        initialize: function (opts) {
            this.compositeModel = new cinema.decorators.Composite(this.model);
            var sharedData = getSharedData(this.compositeModel, this.$el);

            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.layers = sharedData.layer;
            this.searchView = sharedData.searchView;
            this.searchTools = sharedData.searchToolsWidget;

            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            if (this._hasAnalysis) {
                this.histogramModel = sharedData.histogram;
                this.compositeHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList = opts.defaultControls.slice(0);
                this.controlList.push(
                    { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                    { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );
            }

            this.controlModel.on('change', this.refreshCamera, this);
            this.viewpointModel.on('change', this.refreshCamera, this);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            this.searchView.setElement(this.$('.c-body-container')).render();
            this.searchTools.setElement(this.$('.c-tools-panel')).render();
            if (this._hasAnalysis) {
                this.searchInformation.setElement(this.$('.c-information-panel')).render();
                this.compositeHistogram.setElement(this.$('.c-histogram-panel')).render();
                this.$('.c-histogram-panel').toggle(visibility('histogram'));
                this.$('.c-information-panel').toggle(visibility('information'));
            }

            return this;
        }
    });
}());

cinema.viewMapper.registerView('composite-image-stack', 'view', cinema.views.CompositeView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});

cinema.viewMapper.registerView('composite-image-stack', 'search', cinema.views.CompositeSearchView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' },
    ]
});
