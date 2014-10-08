(function () {

    // --------- Add 'view' page for composite-image-stack-depth dataset ----------

    cinema.viewFactory.registerView('composite-image-stack-litdepth', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model }),
            controlModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup(),
                                                  { info: model }),
            compositor = new cinema.utilities.CreateWebGlLightCompositor(),
            renderer = new cinema.views.VisualizationWebGlLightCanvasWidget({
                el: $('.c-body-container', container),
                model: compositeModel,
                layers: layers,
                controlModel: controlModel,
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
                controlModel: controlModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),
            renderingView = new cinema.views.RenderingWidget({
                el: $('.c-rendering-panel', container),
                model: compositeModel,
                toolbarSelector: '.c-panel-toolbar',
                viewport: renderer
            }),
            controlList = [
                { position: 'left',  key: 'rendering', icon: 'icon-picture',   title: 'Rendering'},
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

        function render () {
            var root = $(rootSelector);
            renderer.setElement($('.c-body-container', root)).render();
            compositeTools.setElement($('.c-tools-panel', root)).render();
            renderingView.setElement($('.c-rendering-panel', root)).render();
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
        renderingView.on('change', refreshCamera);
        cinema.events.on('c:resetCamera', resetCamera);

        render();

        return {
            controlList: controlList,
            render: render
        };
    });

}());
