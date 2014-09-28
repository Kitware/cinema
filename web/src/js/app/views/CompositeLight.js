(function () {
    // Create Composite data type view assembly

    cinema.viewFactory.registerView('composite-image-stack-light', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            fieldsModel = new cinema.models.FieldModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ fields: fieldsModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup()),
            renderer = new cinema.views.VisualizationCanvasWidgetLit({
                el: $('.body-content', container),
                model: compositeModel,
                layers: layers,
                fields: fieldsModel,
                viewpoint: viewpointModel
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
                fields: fieldsModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),
            renderingView = new cinema.views.RenderingControlWidget({
                el: $('.c-rendering-panel', container),
                model: compositeModel,
                toolbarSelector: '.c-panel-toolbar',
                viewport: renderer
            }),
            controlList = [
                { position: 'left',  key: 'rendering', icon: 'icon-picture',   title: 'Rendering'},
                { position: 'right', key: 'tools',     icon: 'icon-tools', title: 'Tools' }
            ];

            function render () {
                var root = $(rootSelector);
                renderer.setElement($('.c-body-container', root)).render();
                compositeTools.setElement($('.c-tools-panel', root)).render();
                renderingView.setElement($('.c-rendering-panel', root)).render();
                renderer.forceRedraw();
            }

            function refreshCamera () {
                renderer.showViewpoint();
            }

            function resetCamera () {
                renderer.showViewpoint();
                renderer.resetCamera();
            }

            fieldsModel.on('change', refreshCamera);
            viewpointModel.on('change', refreshCamera);
            renderingView.on('change', refreshCamera);
            cinema.events.on('c:resetCamera', resetCamera);

        render();

        return {
            controls: controlList,
            render: render
        };
    });
}());
