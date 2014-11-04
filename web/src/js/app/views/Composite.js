(function () {
    var sharedDataMap = {},
        visibilityMap = { 'histogram': false, 'information': false };

    function getSharedData(model) {
        if(sharedDataMap.hasOwnProperty(model.getHash())) {
            return sharedDataMap[model.getHash()];
        } else {
            var layer = new cinema.models.LayerModel(model.getDefaultPipelineSetup(), { info: model }),
                control = new cinema.models.ControlModel({ info: model }),
                histogram = new cinema.models.CompositeHistogramModel({
                    layerModel: layer,
                    basePath: model.get('basePath'),
                    analysisInfo: model.attributes.metadata.analysis }),
                viewpoint = new cinema.models.ViewPointModel({ controlModel: control }),
                shared = {
                    control: control,
                    histogram: histogram,
                    layer: layer,
                    viewpoint: viewpoint
                };
            sharedDataMap[model.getHash()] = shared;
            return shared;
        }
    }

    function visibility(name, value) {
        if(value === undefined) {
            return visibilityMap[name];
        } else {
            visibilityMap[name] = value;
        }
    }

    cinema.events.on('toggle-control-panel', function(event) {
        visibility(event.key, event.visible);
    });

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.viewFactory.registerView('composite-image-stack', 'view', function (rootSelector, viewType, model) {
        var container = $(rootSelector),
            dataType = model.getDataType(),
            compositeModel = new cinema.decorators.Composite(model),
            compositeManager = new cinema.utilities.CompositeImageManager({ visModel: model }),
            sharedData = getSharedData(compositeModel),
            controlModel = sharedData.control,
            viewpointModel = sharedData.viewpoint,
            layerModel = sharedData.layer,
            // creation of histogram model is conditional on there actually being analysis available
            histogramModel = (_.has(model.attributes.metadata, 'analysis') === false ? null : sharedData.histogram),
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

           // creation of histogram widget is conditional on there actually being analysis available
           compositeHistogram = (_.has(model.attributes.metadata, 'analysis') === false ? null :
            new cinema.views.CompositeHistogramWidget({
                el: $('.c-histogram-panel', container),
                basePath: model.get('basePath'),
                histogramModel: histogramModel,
                viewpoint: viewpointModel,
                layerModel: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            })),

            compositeTools = new cinema.views.CompositeToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                viewpoint: viewpointModel,
                layers: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            }),

            // creation of histogram widget is conditional on there actually being analysis available
            searchInformation = (_.has(model.attributes.metadata, 'analysis') === false ? null :
             new cinema.views.SearchInformationWidget({
                el: $('.c-information-panel', container),
                model: compositeModel,
                controlModel: controlModel,
                exclude: ['layer', 'filename'],
                layers: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            })),

            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

            // Addition of histogram and search info icons in header is conditional on existence of analysis information
            if (_.has(model.attributes.metadata, 'analysis')) {
                controlList.unshift({ position: 'left', key: 'information', icon: 'icon-help', title: 'Information' });
                controlList.unshift({ position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' });
            }

        function render () {
            var root = $(rootSelector);
            renderer.setElement($('.c-body-container', root)).render();
            compositeTools.setElement($('.c-tools-panel', root)).render();
            if (_.has(model.attributes.metadata, 'analysis')) {
                compositeHistogram.setElement($('.c-histogram-panel', root)).render();
                searchInformation.setElement($('.c-information-panel', root)).render();
            }
            renderer.showViewpoint(true);

            $('.c-histogram-panel', root).toggle(visibility('histogram'));
            $('.c-information-panel', root).toggle(visibility('information')); $('.c-information-panel', root).hide();
        }

        function getInfo () {
            return "tester";
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
            sharedData = getSharedData(compositeModel),
            controlModel = sharedData.control,
            viewpointModel = sharedData.viewpoint,
            layerModel = sharedData.layer,
            histogramModel = (_.has(model.attributes.metadata, 'analysis') === false ? null : sharedData.histogram),

            searchPage = (_.has(model.attributes.metadata, 'analysis') === false ? null :
                new cinema.views.CompositeSearchPage({
                    basePath: model.get('basePath'),
                    histogramModel: histogramModel,
                    visModel: compositeModel,
                    layerModel: layerModel
            })),

            compositeHistogram = (_.has(model.attributes.metadata, 'analysis') === false ? null :
                new cinema.views.CompositeHistogramWidget({
                    el: $('.c-histogram-panel', container),
                    basePath: model.get('basePath'),
                    histogramModel: histogramModel,
                    viewpoint: viewpointModel,
                    layerModel: layerModel,
                    toolbarSelector: '.c-panel-toolbar'
            })),

            searchTools = new cinema.views.SearchToolsWidget({
                el: $('.c-tools-panel', container),
                model: compositeModel,
                layers: layerModel,
                toolbarSelector: '.c-panel-toolbar'
            }),

            searchInformation = (_.has(model.attributes.metadata, 'analysis') === false ? null :
                new cinema.views.SearchInformationWidget({
                    el: $('.c-information-panel', container),
                    model: compositeModel,
                    controlModel: controlModel,
                    exclude: ['layer', 'filename'],
                    layers: layerModel,
                    toolbarSelector: '.c-panel-toolbar'
            })),

            controlList = [
                { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
            ];

            // Addition of histogram and search info icons in header is conditional on existence of analysis information
            if (_.has(model.attributes.metadata, 'analysis')) {
                controlList.unshift({ position: 'left', key: 'information', icon: 'icon-help', title: 'Information' });
                controlList.unshift({ position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' });
            }

        function render () {
            var root = $(rootSelector);
            searchTools.setElement($('.c-tools-panel', root)).render();
            searchPage.setElement($('.c-body-container', root)).render();
            if (_.has(model.attributes.metadata, 'analysis')) {
                compositeHistogram.setElement($('.c-histogram-panel', root)).render();
                searchInformation.setElement($('.c-information-panel', root)).render();
            }

            $('.c-histogram-panel', root).toggle(visibility('histogram'));
            $('.c-information-panel', root).toggle(visibility('information'));
        }

        return {
            controlList: controlList,
            render: render
        };
    });

}());
