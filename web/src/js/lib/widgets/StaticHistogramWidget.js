cinema.views.StaticHistogramWidget = Backbone.View.extend({
    events: {
        'click .c-static-histogram-tools-panel-close': 'toggleHistogramTools',
        'click .c-static-histogram-representation-area': 'toggleHistogramArea',
        'click .c-static-histogram-representation-bar': 'toggleHistogramBar',
        'click .c-static-histogram-representation-lines': 'toggleHistogramLines',
        'click .c-static-histogram-representation-scatter': 'toggleHistogramScatter',
        'click .c-static-histogram-offset-stacked': 'toggleHistogramStacked',
        'click .c-static-histogram-offset-stream': 'toggleHistogramStream',
        'click .c-static-histogram-offset-percent': 'toggleHistogramPercent',
        'click .c-static-histogram-offset-value': 'toggleHistogramValue',
        'click .c-static-histogram-interpolation-cardinal': 'toggleHistogramCardinal',
        'click .c-static-histogram-interpolation-linear': 'toggleHistogramLinear',
        'click .c-static-histogram-interpolation-step': 'toggleHistogramStep'
    },

    initialize: function (settings) {
        this.basePath = settings.basePath;
        this.histogramModel = settings.histogramModel;
        this.viewpoint = settings.viewpoint;

        this.toolbarSelector = settings.toolbarSelector;
        this.toolbarHistogram = new cinema.views.StaticHistogramToolbar({el: settings.toolbarSelector});
        this.representation = 'area';
        this.interpolation = 'cardinal';
        this.offset = 'zero';
        this.unstacked = false;
        this.controlModel = settings.controlModel;
        this.visModel = settings.visModel;
        this.analysisInfo = settings.analysisInfo;

        this.buildStaticHistogramMap();

        this.listenTo(cinema.events, 'toggle-control-panel', this.toggleControlPanel);
        this.listenTo(cinema.events, 'c:edithistogram', this.toggleHistogramTools);
        this.listenTo(cinema.events, 'c:showhistogramlegend', this.toggleHistogramLegend);
        this.listenTo(this.controlModel, 'change', this.updateHistogramModel);
        this.listenTo(this.histogramModel, 'change', this.readyHistogramModel);
    },

    buildStaticHistogramMap: function() {
        var namePattern = this.visModel.attributes.name_pattern;
        var ignoreComponents = ['time', 'phi', 'theta'];
        var regex = /{([^}]+)}/g;
        this.layerComponents = [];
        this.layerEncodingMap = {};
        var m = regex.exec(namePattern);

        while (m) {
            if (!_.contains(ignoreComponents, m[1])) {
                this.layerComponents.push(m[1]);
            }
            m = regex.exec(namePattern);
        }

        for (var i = 0; i < this.analysisInfo.information.length; i+=1) {
            var info = this.analysisInfo.information[i];
            var name = info.name;
            this.layerEncodingMap[name] = {};
            for (var j = 0; j < info.mappings.length; j+=1) {
                var mapping = info.mappings[j];
                this.layerEncodingMap[name][mapping.value] = mapping.code;
            }
        }
    },

    readyHistogramModel: function () {
        var i,
            palette = new Rickshaw.Color.Palette(), series, newSeries = [];

        series = this.histogramModel.getData("series");
        for (i = 0; i < series.length; i = i + 1) {
            series[i].color = palette.color();
            if (series[i].data.length !== 0) {
                newSeries.push(series[i]);
            }
        }
        this.series = newSeries;
        this.render();
    },

    render:  function () {
        if (this.histogramModel.loaded()) {
            this.$('.c-control-panel-body').html(cinema.templates.staticHistogram({
            }));
            this.toolbarHistogram.setElement(this.$(this.toolbarSelector)).render();
            this.drawChart();

            this.$('.c-static-histogram-tools-panel-close[title]').tooltip({
                placement: 'bottom',
                delay: {show: 200}
            });
            this.$('a[title]').tooltip({
                placement: 'bottom',
                delay: {show: 200}
            });
        }
    },

    drawChart: function () {

        var histogramGraph = this.$('.c-static-histogram-graph'),
            histogramLegend = this.$('.c-static-histogram-legend'),
            histogramRange = this.$('.c-static-histogram-range');

        if (histogramGraph.width() > 0 && histogramGraph.height() > 0) {
            this.graph = new Rickshaw.Graph({
                element: histogramGraph[0],
                width: histogramGraph.width() - 40,
                height: histogramGraph.height() - 0.01 * histogramGraph.height(),
                renderer: this.representation,
                stroke: true,
                preserve: true,
                interpolation: this.interpolation,
                offset: this.offset,
                unstacked: this.unstacked,
                series: this.series
            });
            this.graph.render();

            this.xAxis = new Rickshaw.Graph.Axis.X({
                graph: this.graph
            });
            this.xAxis.render();

            this.yAxis = new Rickshaw.Graph.Axis.Y({
                graph: this.graph,
                tickFormat: Rickshaw.Fixtures.Number.formatKMBT
            });
            this.yAxis.render();

            this.preview = new Rickshaw.Graph.RangeSlider.Preview({
                graph: this.graph,
                element: histogramRange[0]
            });

            this.legend = new Rickshaw.Graph.Legend({
                graph: this.graph,
                element: histogramLegend[0]
            });

            var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
                graph: this.graph,
                legend: this.legend
            });

            var highlight = new Rickshaw.Graph.Behavior.Series.Highlight({
                graph: this.graph,
                legend: this.legend
            });

            var hoverDetail = new Rickshaw.Graph.HoverDetail({
                graph: this.graph,
                xFormatter: function (x) {
                    return x + " %";
                },
                yFormatter: function (y) {
                    return Math.floor(y) + " images";
                }
            });
        }

    },

    toggleControlPanel: function (event) {
        if (event.key === 'histogram') {
            this.updateHistogramModel();
        }
    },

    updateChart: function () {
        this.graph.render();
    },

    _refresh: function () {
    },

    change: function (param, value) {
        this._refresh();
    },


    toggleHistogramTools: function () {
        var link = this.$('.c-static-histogram-tools-panel'),
            state;
        if (link.attr('state') === 'on') {
            state = 'off';
            link.attr('state', state);
            link.fadeOut();
        }
        else {
            state = 'on';
            link.attr('state', state);
            link.fadeIn();
        }
    },

    toggleHistogramLegend: function () {
        var link = this.$('.c-static-histogram-legend'),
            state;
        if (link.attr('state') === 'on') {
            state = 'off';
            link.attr('state', state);
            link.fadeOut();
        }
        else {
            state = 'on';
            link.attr('state', state);
            link.fadeIn();
        }
    },

    toggleHistogramArea: function () {
        var link = this.$('.c-static-histogram-representation-area'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-representation-bar');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-lines');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-scatter');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-stacked');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-cardinal');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-linear');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-step');
            other.attr('state', state);
            this.representation = 'area';
            this.interpolation = 'cardinal';
            this.offset = 'zero';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset,
                unstacked: this.unstacked
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramBar: function () {
        var link = this.$('.c-static-histogram-representation-bar'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-representation-area');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-lines');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-scatter');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-stacked');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-step');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-cardinal');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-linear');
            other.attr('state', state);
            this.representation = 'bar';
            this.interpolation = 'step';
            this.offset = 'zero';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramLines: function () {
        var link = this.$('.c-static-histogram-representation-lines'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-representation-area');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-bar');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-scatter');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stacked');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-cardinal');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-linear');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-step');
            other.attr('state', state);
            this.representation = 'line';
            this.interpolation = 'cardinal';
            this.offset = 'value';
            this.unstacked = true;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramScatter: function () {
        var link = this.$('.c-static-histogram-representation-scatter'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-representation-area');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-bar');
            other.attr('state', state);
            other = this.$('.c-static-histogram-representation-lines');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stacked');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-step');
            state = 'on';
            other.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-cardinal');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-linear');
            other.attr('state', state);
            this.representation = 'scatterplot';
            this.interpolation = 'step';
            this.offset = 'value';
            this.unstacked = true;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramStacked: function () {
        var link = this.$('.c-static-histogram-offset-stacked'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            other.attr('state', state);
            this.offset = 'zero';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramStream: function () {
        var link = this.$('.c-static-histogram-offset-stream'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stacked');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            other.attr('state', state);
            this.offset = 'wiggle';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramPercent: function () {
        var link = this.$('.c-static-histogram-offset-percent'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stacked');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-value');
            other.attr('state', state);
            this.offset = 'expand';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramValue: function () {
        var link = this.$('.c-static-histogram-offset-value'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-offset-stacked');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-stream');
            other.attr('state', state);
            other = this.$('.c-static-histogram-offset-percent');
            other.attr('state', state);
            this.offset = 'value';
            this.unstacked = true;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.renderer.unstack = this.unstacked;
            this.graph.render();
        }
    },

    toggleHistogramCardinal: function () {
        var link = this.$('.c-static-histogram-interpolation-cardinal'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-linear');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-step');
            other.attr('state', state);
            this.interpolation = 'cardinal';
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.render();
        }
    },

    toggleHistogramLinear: function () {
        var link = this.$('.c-static-histogram-interpolation-linear'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-cardinal');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-step');
            other.attr('state', state);
            this.interpolation = 'linear';
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.render();
        }
    },

    toggleHistogramStep: function () {
        var link = this.$('.c-static-histogram-interpolation-step'),
            other, state, config;
        if (link.attr('state') !== 'on') {
            state = 'on';
            link.attr('state', state);
            state = 'off';
            other = this.$('.c-static-histogram-interpolation-cardinal');
            other.attr('state', state);
            other = this.$('.c-static-histogram-interpolation-linear');
            other.attr('state', state);
            this.interpolation = 'step';
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            this.graph.configure(config);
            this.graph.render();
        }
    },

    updateHistogramModel: function () {
        var layerCodeElts = [];

        for (var idx = 0; idx < this.layerComponents.length; idx += 1) {
            var lName = this.layerComponents[idx];
            var controlElement = this.controlModel.controlMap[lName];
            var lValue = controlElement.values[parseInt(controlElement.activeIdx)];
            layerCodeElts.push(this.layerEncodingMap[lName][lValue]);
        }

        var layerCodeString = layerCodeElts.join('-');
        this.histogramModel.fetch({'layerCodeString': layerCodeString});
    }

});
