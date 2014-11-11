(function () {
    var sharedDataMap = {},
        visibilityMap = { 'histogram': false, 'information': false };

    var getSharedData = function (model, container, analysis) {
        var key = model.getHash() + '::' + ($(container).attr('container-uid') || 'main');
        if (_.has(sharedDataMap, key)) {
            return sharedDataMap[key];
        } else {
            var control = new cinema.models.ControlModel({
                    info: model
                }),
                viewpoint = new cinema.models.ViewPointModel({
                    controlModel: control
                }),
                renderView = new cinema.views.StaticImageVisualizationCanvasWidget({
                    el: this.$('.c-body-container'),
                    model: model,
                    controlModel: control,
                    viewpoint: viewpoint
                }),
                toolsWidget = new cinema.views.ToolsWidget({
                    el: $('.c-tools-panel', container),
                    model: model,
                    controlModel: control,
                    viewport: renderView,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                searchToolsWidget = new cinema.views.StaticSearchToolsWidget({
                    el: $('.c-tools-panel', container),
                    model: model,
                    toolbarSelector: '.c-panel-toolbar'
                }),
                histogram = null,
                informationWidget = null,
                histogramWidget = null,
                searchView = null,
                metaDataSearchView = null,
                metaDataInformationWidget = null;

            if (analysis) {
                histogram = new cinema.models.StaticHistogramModel({
                    basePath: model.get('basePath'),
                    analysisInfo: model.get('metadata').analysis,
                    namePattern: model.get('name_pattern')
                });
                informationWidget = new cinema.views.ComposableInformationWidget({
                    el: $('.c-information-panel', container),
                    model: model,
                    controlModel: control,
                    exclude: ['layer', 'filename'],
                    analysisInfo: model.get('metadata').analysis,
                    toolbarSelector: '.c-panel-toolbar'
                });
                histogramWidget = new cinema.views.StaticHistogramWidget({
                    el: $('.c-static-histogram-panel', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogram,
                    viewpoint: viewpoint,
                    controlModel: control,
                    visModel: model,
                    analysisInfo: model.get('metadata').analysis,
                    toolbarSelector: '.c-panel-toolbar'
                });
                searchView = new cinema.views.StaticSearchPage({
                    el: $('.c-body-container', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogram,
                    visModel: model,
                    controlModel: control
                });
            } else {
                metaDataSearchView = new cinema.views.MetaDataStaticSearchPage({
                    el: $('.c-body-container', container),
                    visModel: model,
                    controlModel: control
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
                control: control,
                histogram: histogram,
                viewpoint: viewpoint,
                informationWidget: informationWidget,
                renderView: renderView,
                histogramWidget: histogramWidget,
                toolsWidget: toolsWidget,
                searchToolsWidget: searchToolsWidget,
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

    cinema.views.StaticImageView = Backbone.View.extend({
        initialize: function (opts) {
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            var sharedData = getSharedData(this.model, this.$el, this._hasAnalysis);
            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.renderView = sharedData.renderView;
            this.toolsWidget = sharedData.toolsWidget;

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

            if (this._hasAnalysis) {
                this.staticHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList = opts.defaultControls.slice(0);
                this.controlList.push(
                    { position: 'center', key: 'static-histogram', icon: 'icon-chart-bar', title: 'Histogram' }
                );
                this.histogramModel = sharedData.histogram;
                this.histogramModel.fetch( { 'controlModel': this.controlModel } );
            } else {
                this.searchInformation = sharedData.metaDataInformationWidget;
            }

            this.listenTo(this.controlModel, 'change', this.refreshCamera);
            this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
            this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
        },

        render: function () {
            this.renderView.setElement(this.$('.c-body-container')).render().showViewpoint(true);
            this.toolsWidget.setElement(this.$('.c-tools-panel')).render();
            this.searchInformation.setElement(this.$('.c-information-panel')).render();
            this.$('.c-information-panel').toggle(visibility('information'));
            if (this._hasAnalysis) {
                this.staticHistogram.setElement(this.$('.c-static-histogram-panel')).render();
                this.$('.c-static-histogram-panel').toggle(visibility('histogram'));
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
                this.renderView.resetCamera();
            }
        },

        remove: function () {
            getSharedData(this.model, this.$el, this._hasAnalysis).remove();
        }
    });

    cinema.views.StaticImageSearchView = Backbone.View.extend({
        initialize: function (opts) {
            this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');
            var sharedData = getSharedData(this.model, this.$el, this._hasAnalysis);

            this.controlModel = sharedData.control;
            this.viewpointModel = sharedData.viewpoint;
            this.searchTools = sharedData.searchToolsWidget;

            if (this._hasAnalysis) {
                this.searchView = sharedData.searchView;
                this.staticHistogram = sharedData.histogramWidget;
                this.searchInformation = sharedData.informationWidget;
                this.controlList = opts.defaultControls.slice(0);
                this.controlList.push(
                    { position: 'center', key: 'static-histogram', icon: 'icon-chart-bar', title: 'Histogram' }
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
                this.staticHistogram.setElement(this.$('.c-static-histogram-panel')).render();
                this.$('.c-static-histogram-panel').toggle(visibility('histogram'));
            }
            return this;
        },

        remove: function () {
            getSharedData(this.model, this.$el, this._hasAnalysis).remove();
        }
    });
}());

cinema.viewMapper.registerView('parametric-image-stack', 'view', cinema.views.StaticImageView, {
    controls: [
        { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});

cinema.viewMapper.registerView('parametric-image-stack', 'search', cinema.views.StaticImageSearchView, {
    controls: [
        { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});
