(function () {

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
            histogramModel = new cinema.models.HistogramModel({ layers: layers,
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

            controlList = [
                { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' },
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ],
            firstRender = true;

        function render () {
            var root = $(rootSelector);
            compositeHistogram.setElement($('.c-histogram-panel')).render();
            compositeTools.setElement($('.c-tools-panel')).render();
            renderer.render();
            renderer.showViewpoint(true);
            if (firstRender) {
                firstRender = false;
                $('.c-histogram-panel', root).hide();
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
            page = new cinema.views.CompositeSearchPage({
                visModel: compositeModel,
                layerModel: layers
            }),

            compositeTools = new cinema.views.CompositeToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),

            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

        function render () {
            var root = $(rootSelector);
            page.setElement(root).render();
            compositeTools.setElement($('.c-tools-panel')).render();
        }

        return {
            controlList: controlList,
            render: render
        };
    });

}());
