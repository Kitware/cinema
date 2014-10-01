(function () {

    // --------- Add 'view' page for composite-image-stack-depth dataset ----------

    cinema.viewFactory.registerView('composite-image-stack-jpgdepth', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model, files: ['rgb.jpg', 'depth.jpg']  }),
            controlsModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlsModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup()),
            compositor = new cinema.utilities.CreateWebGlJpgCompositor(),
            renderer = new cinema.views.VisualizationWebGlJpgCanvasWidget({
                el: $('.c-body-container', container),
                model: compositeModel,
                layers: layers,
                controls: controlsModel,
                viewpoint: viewpointModel,
                compositeManager: compositeManager,
                webglCompositor: compositor
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
                controlModel: controlsModel,
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

        controlsModel.on('change', refreshCamera);
        viewpointModel.on('change', refreshCamera);
        cinema.events.on('c:resetCamera', resetCamera);

        render();

        return {
            controlList: controlList,
            render: render
        };
    });

}());
