(function () {
var sharedDataMap = {},
    visibilityMap = { 'histogram': false, 'information': false };


    var getSharedData = function (model, container) {
        var key = model.getHash() + '::' + ($(container).attr('container-uid') || 'main');
        if (_.has(sharedDataMap, key)) {
            return sharedDataMap[key];
        } else {
            var layer = new cinema.models.LayerModel(model.getDefaultPipelineSetup(), { info: model }),
                control = new cinema.models.ControlModel({ info: model }),
                histogram = new cinema.models.CompositeHistogramModel({
                    layerModel: layer,
                    basePath: model.get('basePath'),
                    analysisInfo: model.attributes.metadata.analysis }),
                viewpoint = new cinema.models.ViewPointModel({ controlModel: control }),
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
                shared = {
                    control: control,
                    histogram: histogram,
                    layer: layer,
                    viewpoint: viewpoint,
                    informationWidget: informationWidget,
                    histogramWidget: histogramWidget,
                    compositeToolsWidget: compositeToolsWidget,
                    searchToolsWidget: searchToolsWidget
                };
            sharedDataMap[key] = shared;
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
            this.compositeManager = new cinema.utilities.CompositeImageManager({ visModel: this.model });
            var sharedData = getSharedData(this.compositeModel, this.$el);

            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.layers = sharedData.layer;
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');

            this.compositeTools = sharedData.compositeToolsWidget;

            if (this._hasAnalysis) {
                this.histogramModel = sharedData.histogram;
                this.controlList = opts.defaultControls.slice(0); // copy
                this.compositeHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList.push(
                    { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                    { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );
            }

            this.listenTo(this.controlModel, 'change', this.refreshCamera);
            this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            if (this.renderView) {
                this.renderView.remove();
            }

            this.renderView = new cinema.views.VisualizationCanvasWidget({
                el: this.$('.c-body-container'),
                model: this.compositeModel,
                layers: this.layers,
                controls: this.controlModel,
                viewpoint: this.viewpointModel,
                compositeManager: this.compositeManager
            });

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

            this.renderView.render().showViewpoint();
            //this.compositeTools.render();
            this.compositeTools.setElement(this.$('.c-tools-panel')).render();

            if (this._hasAnalysis) {
                //this.compositeHistogram.render();
                this.compositeHistogram.setElement(this.$('.c-histogram-panel')).render();
                // this.searchInformation.render();
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
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');

            this.searchTools = sharedData.searchToolsWidget;

            if (this._hasAnalysis) {
                this.histogramModel = sharedData.histogram;

                this.compositeHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;

                this.controlList = opts.defaultControls.slice(0); // copy
                this.controlList.push(
                    { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                    { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );
            }

            this.listenTo(this.controlModel, 'change', this.refreshCamera);
            this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            if (this._hasAnalysis) {
                if (this.searchView) {
                    this.searchView.remove();
                }

                this.searchView = new cinema.views.CompositeSearchPage({
                    el: this.$('.c-body-container'),
                    basePath: this.model.get('basePath'),
                    histogramModel: this.histogramModel,
                    visModel: this.compositeModel,
                    layerModel: this.layers
                });

                this.searchView.render();

                //this.searchInformation.render();
                this.searchInformation.setElement(this.$('.c-information-panel')).render();
                this.compositeHistogram.setElement(this.$('.c-histogram-panel')).render();

                this.$('.c-histogram-panel').toggle(visibility('histogram'));
                this.$('.c-information-panel').toggle(visibility('information'));
            }

            //this.searchTools.render();
            this.searchTools.setElement(this.$('.c-tools-panel')).render();

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
