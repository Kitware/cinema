cinema.views.CompositeView = Backbone.View.extend({
    initialize: function () {
        this.compositeModel = new cinema.decorators.Composite(this.model);
        this.compositeManager = new cinema.utilities.CompositeImageManager({ visModel: this.model });
        this.controlModel = new cinema.models.ControlModel({ info: this.model });
        this.viewpointModel = new cinema.models.ViewPointModel({ controlModel: this.controlModel });
        this.layers = new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup(),
            { info: this.model });
        this.histogramModel = new cinema.models.HistogramModel({
            layerModel: this.layers,
            basePath: this.model.get('basePath')
        });

        this.controlModel.on('change', this.refreshCamera, this);
        this.viewpointModel.on('change', this.refreshCamera, this);
        this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);

        this.firstRender = true;
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

        if (this.toolsWidget) {
            this.toolsWidget.remove();
        }
        if (this.histogramWidget) {
            this.histogramWidget.remove();
        }
        if (this.infoWidget) {
            this.infoWidget.remove();
        }

        this.toolsWidget = new cinema.views.CompositeToolsWidget({
            el: this.$('.c-tools-panel'),
            model: this.compositeModel,
            controlModel: this.controlModel,
            viewpoint: this.viewpointModel,
            layers: this.layers,
            toolbarSelector: '.c-panel-toolbar'
        });

        this.histogramWidget = new cinema.views.HistogramWidget({
             el: this.$('.c-histogram-panel'),
             basePath: this.model.get('basePath'),
             histogramModel: this.histogramModel,
             viewpoint: this.viewpointModel,
             layers: this.layers,
             toolbarSelector: '.c-panel-toolbar'
         })

        this.infoWidget = new cinema.views.SearchInformationWidget({
            el: this.$('.c-information-panel'),
            model: this.compositeModel,
            controlModel: this.controlModel,
            exclude: ['layer', 'filename'],
            layers: this.layers,
            toolbarSelector: '.c-panel-toolbar'
        });

        this.toolsWidget.render();
        this.histogramWidget.render();
        this.infoWidget.render();

        if (this.firstRender) {
            this.firstRender = false;
            this.$('.c-histogram-panel').hide();
            this.$('.c-information-panel').hide();
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

cinema.viewMapper.registerView('composite-image-stack', 'view', cinema.views.CompositeView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' },
        { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
        { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
    ]
});
/*(function () {

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model }),
            controlModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup(),
                                                  { info: model }),
            histogramModel = new cinema.models.HistogramModel({ layerModel: layers,
                                                                basePath: model.get('basePath') }),
            renderer = new cinema.views.VisualizationCanvasWidget({
                el: container,
                model: compositeModel,
                layers: layers,
                controlModel: controlModel,
                viewpoint: viewpointModel,
                compositeManager: compositeManager
            }),
            mouseInteractor = new cinema.utilities.RenderViewMouseInteractor({
                renderView: renderer,
                camera: viewpointModel
            }).enableMouseWheelZoom({
                maxZoomLevel: 10,
                zoomIncrement: 0.05,
                invertControl: false
            }).enableDragPan({
                keyModifiers: cinema.keyModifiers.SHIFT
            }).enableDragRotation({
                keyModifiers: null
            }),

           compositeHistogram = new cinema.views.HistogramWidget({
                el: $('.c-histogram-panel', container),
                basePath: model.get('basePath'),
                histogramModel: histogramModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            compositeTools = new cinema.views.CompositeToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            searchInformation = new cinema.views.SearchInformationWidget({
                el: $('.c-information-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                exclude: ['layer', 'filename'],
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' },
                { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
            ],
            firstRender = true;

        function render () {
            var root = $(rootSelector);
            renderer.setElement($('.c-body-container', root)).render();
            compositeHistogram.setElement($('.c-histogram-panel', root)).render();
            compositeTools.setElement($('.c-tools-panel', root)).render();
            searchInformation.setElement($('.c-information-panel', root)).render();
            renderer.showViewpoint(true);
            if (firstRender) {
                firstRender = false;
                $('.c-histogram-panel', root).hide();
                $('.c-information-panel', root).hide();
            }
        }

        function refreshCamera () {
            renderer.showViewpoint();
        }

        function resetCamera () {
            renderer.showViewpoint();
            renderer.resetCamera();
        }

        controlModel.on('change', refreshCamera);
        viewpointModel.on('change', refreshCamera);
        cinema.events.on('c:resetCamera', resetCamera);

        return {
            controlList: controlList,
            render: render
        };
    });

    // --------- Add 'search' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'search', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            controlModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup(), { info: model }),
            histogramModel = new cinema.models.HistogramModel({ layerModel: layers,
                basePath: model.get('basePath') }),

            searchPage = new cinema.views.CompositeSearchPage({
                basePath: model.get('basePath'),
                histogramModel: histogramModel,
                visModel: compositeModel,
                layerModel: layers
            }),

            compositeHistogram = new cinema.views.HistogramWidget({
                el: $('.c-histogram-panel', container),
                basePath: model.get('basePath'),
                histogramModel: histogramModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            searchTools = new cinema.views.SearchToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            searchInformation = new cinema.views.SearchInformationWidget({
                el: $('.c-information-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                exclude: ['layer', 'filename'],
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' },
                { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
            ],
            firstRender = true;

        function render () {
            var root = $(rootSelector);
            searchPage.setElement($('.c-body-container', root)).render();
            searchTools.setElement($('.c-tools-panel', root)).render();
            compositeHistogram.setElement($('.c-histogram-panel', root)).render();
            searchInformation.setElement($('.c-information-panel', root)).render();
            if (firstRender) {
                firstRender = false;
                $('.c-histogram-panel', root).hide();
                $('.c-information-panel', root).hide();
            }
        }

        return {
            controlList: controlList,
            render: render
        };
    });

}());*/
