(function () {

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model }),
            fieldsModel = new cinema.models.FieldModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ fields: fieldsModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup()),
            renderer = new cinema.views.VisualizationCanvasWidget({
                el: $('.c-body-container', container),
                model: compositeModel,
                layers: layers,
                fields: fieldsModel,
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
            compositePipeline = new cinema.views.CompositePipelineWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                fields: fieldsModel,
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
            compositePipeline.setElement($('.c-tools-panel', root)).render();
            renderer.showViewpoint(true);
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
        cinema.events.on('c:resetCamera', resetCamera);

        render();

        return {
            controls: controlList,
            render: render
        };
    });

    // --------- Add 'search' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'search', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            fieldsModel = new cinema.models.FieldModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ fields: fieldsModel }),
            layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup()),
            // compositePipeline = new cinema.views.PipelineControlWidget({
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
            controls: controlList,
            render: render
        };
    });

}());
