(function () {

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model }),
            controlModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup()),
            histogramModel = new cinema.models.HistogramModel({ layers: layers,
                                                                basePath: model.get('basePath') }),
            renderer = new cinema.views.VisualizationCanvasWidget({
                el: $('.c-body-container', container),
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

            controlList = [
                { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' },
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

        cinema.events.trigger('c:initCompositeHistogram', {
            container: container,
            basePath: model.get('basePath'),
            histogramModel: histogramModel,
            viewpointModel: viewpointModel,
            layers: layers
        });

        cinema.events.trigger('c:initCompositeTools', {
            container: container,
            compositeModel: compositeModel,
            controlModel: controlModel,
            viewpointModel: viewpointModel,
            layers: layers
        });

        function render () {
            var root = $(rootSelector);
            renderer.setElement($('.c-body-container', root)).render();
            cinema.events.trigger('c:renderCompositeHistogram', {root: root});
            cinema.events.trigger('c:renderCompositeTools', {root: root});
            renderer.showViewpoint(true);
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
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup()),
            page = new cinema.views.CompositeSearchPage({
                visModel: compositeModel,
                layerModel: layers
            }),
            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

            cinema.events.trigger('c:initCompositeTools', {
                container: container,
                compositeModel: compositeModel,
                controlModel: controlModel,
                viewpointModel: viewpointModel,
                layers: layers
            });

        function render () {
            var root = $(rootSelector);
            page.setElement($('.c-body-container', root)).render();
            cinema.events.trigger('c:renderCompositeTools', {root: root});
        }

        return {
            controlList: controlList,
            render: render
        };
    });

}());
