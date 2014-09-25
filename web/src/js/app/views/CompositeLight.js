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
            compositePipeline = new cinema.views.CompositePipelineWidget({
                el: $('.c-rv-tools-panel', container),
                model: compositeModel,
                fields: fieldsModel,
                viewpoint: viewpointModel,
                layers: layers,
                toolbarSelector: '.c-panel-toolbar'
            }),
            colorTransformationView = new cinema.views.ColorTransformationWidget({
                el: $('.c-rv-colorTransform-control-container', container),
                model: compositeModel,
                viewport: renderer
            }),
            controlList = [
                { position: 'right', key: 'tools',     icon: 'icon-tools', title: 'Tools' },
                { position: 'left',  key: 'colorTransform', icon: 'icon-tint',   title: 'Color Transformation'}
            ];

            function render () {
                var root = $(rootSelector);
                renderer.setElement($('.c-body-container', root)).render();
                compositePipeline.setElement($('.c-tools-panel', root)).render();
                colorTransformationView.setElement($('.c-colorTransform-control-container', root)).render();
                refreshCamera(true);
            }

            function refreshCamera (force) {
                if(force) {
                    renderer.forceRedraw();
                } else {
                    renderer.showViewpoint();
                }
            }

            function resetCamera () {
                renderer.showViewpoint();
                renderer.resetCamera();
            }

            fieldsModel.on('change', refreshCamera);
            viewpointModel.on('change', refreshCamera);
            colorTransformationView.on('change', function() {
                refreshCamera(true);
            });
            cinema.events.on('c:resetCamera', resetCamera);

            render();

        return {
            controls: controlList,
            render: render
        };
    });
}());
