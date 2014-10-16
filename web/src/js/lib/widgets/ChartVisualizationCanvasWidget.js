/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 * This implementation assume static json file.
 */
cinema.views.ChartVisualizationCanvasWidget = Backbone.View.extend({
    // Expose primitive events from the canvas for building interactors
    events: {
        //
    },

    //subclass uses to extend
    _privateInit: function () {
    },

    initialize: function (settings) {
        this.model = settings.model;
        this.controlModel = settings.controlModel;
        this.viewpoint = settings.viewpoint;

        this.representation = 'area';
        this.interpolation = 'cardinal';
        this.offset = 'zero';
        this.unstacked = false;

        this.graph = null;

        if (!this.model.loaded()) {
            this.listenToOnce(this.model, 'change', function () {
                this.initialize(settings);
            });
            return;
        }

        this.chartManager = settings.chartManager || this.model.chartManager ||
            new cinema.utilities.ChartManager({
                visModel: this.model
            });

        this._privateInit();
        this._controls = {};
        this._first = true;
        this.listenTo(this.controlModel, 'change', this.render);
        this.listenTo(this.viewpoint, 'change', this.render);
        this.listenTo(cinema.events, 'toggle-chart-appearance', this.updateChart);
        this.listenTo(this.chartManager, 'c:data.ready', function () {
            if (this._first) {
                this._first = false;
            }
            this.render();
        });

        cinema.bindWindowResizeHandler(this, this.render, 200);

        this.showViewpoint();
    },

    render: function () {
        this.$el.html(cinema.templates.chart());
        this.drawChart();
        return this;
    },

    /**
     * Call this after data has been successfully rendered onto the composite
     * canvas, and it will draw it with the correct scale, zoom, and center
     * onto the render canvas.
     */
    drawChart: function () {
        var data = this.chartManager.getData(),
            w = this.$el.parent().width(),
            h = this.$el.parent().height(),
            palette = new Rickshaw.Color.Palette(),
            that = this;

        if (data === null) {
            return;
        }

        function convertToIndex(value) {
            var array = data[2].map,
                count = array.length,
                test = true;

            while (count > 0) {
                count = count - 1;
                if(array[count].value === value) {
                    return array[count].index;
                }
            }

            console.log('Did not find the value ' + value);
            return 0;
        }

        this.series = data[0].series;
        this.highlight = data[1].highlight;

        for (var i = 0; i < this.series.length; i = i + 1) {
            this.series[i].color = palette.color();
        }

        var chartGraph = this.$('.c-chart-graph'),
            chartLegend = this.$('.c-chart-legend'),
            chartRange = this.$('.c-chart-range');

        this.graph = new Rickshaw.Graph({
            element: chartGraph[0],
            width: w,
            height: h - 0.22 * h,
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
            element: chartRange[0]
        });

        this.legend = new Rickshaw.Graph.Legend({
            graph: this.graph,
            element: chartLegend[0]
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
                return that.highlight[convertToIndex(x)];
            },
            yFormatter: function (y) {
                return Math.floor(y);
            }
        });
    },

    updateChart: function (settings) {
        this.representation = settings.config.renderer;
        this.interpolation = settings.config.interpolation;
        this.offset = settings.config.offset;
        this.unstacked = settings.unstacked;
        this.graph.configure(settings.config);
        this.graph.renderer.unstack = this.unstacked;
        this.graph.render();
    },

    /**
     * Change the viewpoint to show a different json.
     * @param viewpoint An object containing control keys. If you
     * do not pass this, simply renders the current this.viewpoint value.
     * @return this, for chainability
     */
    showViewpoint: function () {
        var changed = false,
            controls = this.controlModel.getControls();

        // Search for change
        for (var key in controls) {
            if (_.has(this._controls, key)) {
                if (this._controls[key] !== controls[key]) {
                    changed = true;
                }
            } else {
                changed = true;
            }
        }
        this._controls = _.extend(this._controls, controls);

        if (changed) {
            this.chartManager.updateControls(this._controls);
        } else {
            this.render();
        }
        return this;
    }
});
