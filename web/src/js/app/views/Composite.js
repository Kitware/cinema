(function () {

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model }),
            controlModel = new cinema.models.ControlModel({ info: model }),
            viewpointModel = new cinema.models.ViewPointModel({ controlModel: controlModel }),
            layerModel = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup(),
                                                     { info: model }),
            histogramModel = new cinema.models.CompositeHistogramModel({ layerModel: layerModel,
                                                                         basePath: model.get('basePath') }),
            renderer = new cinema.views.VisualizationCanvasWidget({
                el: container,
                model: compositeModel,
                layers: layerModel,
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

           compositeHistogram = new cinema.views.CompositeHistogramWidget({
                el: $('.c-histogram-panel', container),
                basePath: model.get('basePath'),
                histogramModel: histogramModel,
                viewpoint: viewpointModel,
                layerModel: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            }),

            compositeTools = new cinema.views.CompositeToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                viewpoint: viewpointModel,
                layers: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            }),

            searchInformation = new cinema.views.SearchInformationWidget({
                el: $('.c-information-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                exclude: ['layer', 'filename'],
                layers: layerModel,
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
            layerModel = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup(), { info: model }),
            histogramModel = new cinema.models.HistogramModel({ layers: layerModel,
                basePath: model.get('basePath') }),

            page = new cinema.views.CompositeSearchPage({
                visModel: compositeModel,
                layerModel: layerModel
            }),

            compositeHistogram = new cinema.views.HistogramWidget({
                el: $('.c-histogram-panel', container),
                basePath: model.get('basePath'),
                histogramModel: histogramModel,
                viewpoint: viewpointModel,
                layers: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            }),

            compositeTools = new cinema.views.CompositeToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                viewpoint: viewpointModel,
                layers: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            }),

            searchInformation = new cinema.views.SearchInformationWidget({
                el: $('.c-information-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                exclude: ['layer', 'filename'],
                layers: layerModel,
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
            page.setElement($('.c-body-container', root)).render();
            compositeTools.setElement($('.c-tools-panel', root)).render();
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

}());
