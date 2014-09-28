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
            renderer.setElement($('.c-body-container', root)).render();
            compositeTools.setElement($('.c-tools-panel', root)).render();
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

        render();

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
            // compositePipeline = new cinema.views.PipelineWidget({
            //     el: $('.c-tools-panel', container),
            //     model: compositeModel,
            //     viewpoint: viewpointModel,
            //     layers: layers,
            //     toolbarSelector: '.c-panel-toolbar'
            // }),
            page = new cinema.views.CompositeSearchPage({ visModel: compositeModel }),
            controlList = [
                // { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

        function render () {
            var root = $(rootSelector);
            page.setElement($('.c-body-container', root)).render();
            // compositePipeline.setElement($('.c-tools-panel', root)).render();
        }

        render();

        return {
            controlList: controlList,
            render: render
        };
    });

}());
