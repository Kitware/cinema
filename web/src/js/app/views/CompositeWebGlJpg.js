(function () {
    var sharedDataMap = {},
        visibilityMap = { 'histogram': false, 'information': false };

    var getSharedData = function (model, container, analysis) {
        var key = model.getHash() + '::' + ($(container).attr('container-uid') || 'main');
        if (_.has(sharedDataMap, key)) {
            return sharedDataMap[key];
        } else {

            var layer = new cinema.models.LayerModel(model.getDefaultPipelineSetup(), {
                    info: model
                }),
                control = new cinema.models.ControlModel({
                    info: model
                }),
                viewpoint = new cinema.models.ViewPointModel({
                    controlModel: control
                }),
                compositor = new cinema.utilities.CreateWebGlJpgCompositor(),
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
                    visModel: model,
                    files: ['rgb.jpg', 'depth.jpg']
                }),
                renderView = new cinema.views.VisualizationWebGlJpgCanvasWidget({
                    el: this.$('.c-body-container', container),
                    model: model,
                    layers: layer,
                    viewpoint: viewpoint,
                    compositeManager: imageManager,
                    webglCompositor: compositor
                }),
                offScreenLayer = new cinema.models.LayerModel(model.getDefaultPipelineSetup(), {
                    info: model
                }),
                offScreenControl = new cinema.models.ControlModel({
                    info: model
                }),
                offScreenViewpoint = new cinema.models.ViewPointModel({
                    controlModel: offScreenControl
                }),
                offScreenRenderView = new cinema.views.VisualizationWebGlJpgCanvasWidget({
                    el: this.$('.c-body-container', container),
                    model: model,
                    layers: offScreenLayer,
                    viewpoint: offScreenViewpoint,
                    compositeManager: imageManager,
                    webglCompositor: compositor
                }),
                histogram = null,
                informationWidget = null,
                histogramWidget = null,
                searchView = null,
                metaDataSearchView = null,
                metaDataInformationWidget = null;

            if (analysis) {
                histogram = new cinema.models.CompositeHistogramModel({
                    layerModel: layer,
                    basePath: model.get('basePath'),
                    analysisInfo: model.attributes.metadata.analysis
                });
                informationWidget = new cinema.views.SearchInformationWidget({
                    el: $('.c-information-panel', container),
                    model: model,
                    controlModel: control,
                    exclude: ['layer', 'filename'],
                    layers: layer,
                    toolbarSelector: '.c-panel-toolbar'
                });
                histogramWidget = new cinema.views.CompositeHistogramWidget({
                    el: $('.c-histogram-panel', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogram,
                    viewpoint: viewpoint,
                    layerModel: layer,
                    toolbarSelector: '.c-panel-toolbar'
                });
                searchView = new cinema.views.CompositeSearchPage({
                    el: $('.c-body-container', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogram,
                    visModel: model,
                    controlModel: control,
                    layerModel: layer,
                    offScreenControl: offScreenControl,
                    offScreenRenderView: offScreenRenderView
                });
            } else {
                metaDataSearchView = new cinema.views.MetaDataCompositeSearchPage({
                    el: $('.c-body-container', container),
                    visModel: model,
                    controlModel: control,
                    layerModel: layer,
                    offScreenControl: offScreenControl,
                    offScreenRenderView: offScreenRenderView
                });
                metaDataInformationWidget = new cinema.views.MetaDataSearchInformationWidget({
                    el: $('.c-information-panel', container),
                    model: model,
                    controlModel: control,
                    exclude: ['layer', 'filename'],
                    toolbarSelector: '.c-panel-toolbar'
                });
            }

            var shared = {
                key: key,
                control: control,
                histogram: histogram,
                layer: layer,
                viewpoint: viewpoint,
                compositor: compositor,
                informationWidget: informationWidget,
                histogramWidget: histogramWidget,
                compositeToolsWidget: compositeToolsWidget,
                searchToolsWidget: searchToolsWidget,
                imageManager: imageManager,
                renderView: renderView,
                offScreenLayer: offScreenLayer,
                offScreenControl: offScreenControl,
                offScreenViewpoint: offScreenViewpoint,
                offScreenRenderView: offScreenRenderView,
                searchView: searchView,
                metaDataSearchView: metaDataSearchView,
                metaDataInformationWidget: metaDataInformationWidget,
                remove: function () {

                }
            };
            sharedDataMap[key] = shared;
            return shared;
        }
    };

    var freeSharedDataMap = function (key) {
        delete sharedDataMap[key];
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

    cinema.views.CompositeWebGlJpgView = Backbone.View.extend({
        initialize: function (opts) {
            this.compositeModel = new cinema.decorators.Composite(this.model);
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            var sharedData = getSharedData(this.compositeModel, this.$el, this._hasAnalysis);
            this.key = sharedData.key;

            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
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

            if (this._hasAnalysis) {
                this.controlList = opts.defaultControls.slice(0);
                this.compositeHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList.push(
                    { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );

                sharedData.histogram.fetch();
            } else {
                this.searchInformation = sharedData.metaDataInformationWidget;
            }

            this.listenTo(this.controlModel, 'change', this.refreshCamera);
            this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            this.renderView.setElement(this.$('.c-body-container')).render().showViewpoint(true);
            this.compositeTools.setElement(this.$('.c-tools-panel')).render();
            this.searchInformation.setElement(this.$('.c-information-panel')).render();
            this.$('.c-information-panel').toggle(visibility('information'));
            if (this._hasAnalysis) {
                this.compositeHistogram.setElement(this.$('.c-histogram-panel')).render();
                this.$('.c-histogram-panel').toggle(visibility('histogram'));
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
        },

        remove: function () {
            getSharedData(this.compositeModel, this.$el, this._hasAnalysis).remove();

            // SharedData
            freeSharedDataMap(this.key);

            // Connections to SharedData
            this.key = null;

            // Models
            this.controlModel.remove();
            this.viewpointModel.remove();

            // Views
            this.renderView.remove();
            this.compositeTools.remove();
            if (this._hasAnalysis) {
                this.compositeHistogram.remove();
                this.searchInformation.remove();
            } else {
                this.searchInformation.remove();
            }
        }
    });

    cinema.views.CompositeWebGlJpgSearchView = Backbone.View.extend({
        initialize: function (opts) {
            this.compositeModel = new cinema.decorators.Composite(this.model);
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            var sharedData = getSharedData(this.compositeModel, this.$el, this._hasAnalysis);
            this.key = sharedData.key;

            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.searchTools = sharedData.searchToolsWidget;

            if (this._hasAnalysis) {
                this.searchView = sharedData.searchView;
                this.compositeHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList = opts.defaultControls.slice(0);
                this.controlList.push(
                    { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );
            } else {
                this.searchView = sharedData.metaDataSearchView;
                this.searchInformation = sharedData.metaDataInformationWidget;
            }
        },

        render: function () {
            this.searchView.setElement(this.$('.c-body-container')).render();
            this.searchTools.setElement(this.$('.c-tools-panel')).render();
            this.searchInformation.setElement(this.$('.c-information-panel')).render();
            this.$('.c-information-panel').toggle(visibility('information'));
            if (this._hasAnalysis) {
                this.compositeHistogram.setElement(this.$('.c-histogram-panel')).render();
                this.$('.c-histogram-panel').toggle(visibility('histogram'));
            }
            return this;
        },

        remove: function () {
            getSharedData(this.compositeModel, this.$el, this._hasAnalysis).remove();

            // SharedData
            freeSharedDataMap(this.key);

            // Connections to SharedData
            this.key = null;

            // Models
            this.controlModel.remove();
            this.viewpointModel.remove();

            // Views
            this.searchView.remove();
            this.searchTools.remove();
            if (this._hasAnalysis) {
                this.compositeHistogram.remove();
                this.searchInformation.remove();
            } else {
                this.searchInformation.remove();
            }
        }
    });
}());

cinema.viewMapper.registerView('composite-image-stack-jpgdepth', 'view', cinema.views.CompositeWebGlJpgView, {
    controls: [
        { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});

cinema.viewMapper.registerView('composite-image-stack-jpgdepth', 'search', cinema.views.CompositeWebGlJpgSearchView, {
    controls: [
        { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});
