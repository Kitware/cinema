cinema.views.ChartWidget = Backbone.View.extend({
    events: {
        'click .c-chart-representation[type="area"]': 'toggleChartArea',
        'click .c-chart-representation[type="bar"]': 'toggleChartBar',
        'click .c-chart-representation[type="lines"]': 'toggleChartLines',
        'click .c-chart-representation[type="scatter"]': 'toggleChartScatter',
        'click .c-chart-offset[type="stacked"]': 'toggleChartStacked',
        'click .c-chart-offset[type="stream"]': 'toggleChartStream',
        'click .c-chart-offset[type="percent"]': 'toggleChartPercent',
        'click .c-chart-offset[type="value"]': 'toggleChartValue',
        'click .c-chart-interpolation[type="cardinal"]': 'toggleChartCardinal',
        'click .c-chart-interpolation[type="linear"]': 'toggleChartLinear',
        'click .c-chart-interpolation[type="step"]': 'toggleChartStep'
    },

    initialize: function (settings) {
        this.representation = 'area';
        this.interpolation = 'cardinal';
        this.offset = 'zero';
        this.unstacked = false;
        this.defaultsToggles = {

        };
    },

    render:  function () {
        this.$el.html(cinema.templates.chartWidget({
            }));

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    },

    toggleChartArea: function () {
        var link = this.$('.c-chart-representation[type="area"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var representations = $('.c-chart-representation');
            representations.not(link).attr('state', 'off');
            link = this.$('.c-chart-offset[type="stacked"]');
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');
            link = this.$('.c-chart-interpolation[type="cardinal"]');
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.representation = 'area';
            this.interpolation = 'cardinal';
            this.offset = 'zero';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartBar: function () {
        var link = this.$('.c-chart-representation[type="bar"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var representations = $('.c-chart-representation');
            representations.not(link).attr('state', 'off');
            link = this.$('.c-chart-offset[type="stacked"]');
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');
            link = this.$('.c-chart-interpolation[type="step"]');
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.representation = 'bar';
            this.interpolation = 'step';
            this.offset = 'zero';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });

        }
    },

    toggleChartLines: function () {
        var link = this.$('.c-chart-representation[type="lines"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var representations = $('.c-chart-representation');
            representations.not(link).attr('state', 'off');
            link = this.$('.c-chart-offset[type="value"]');
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');
            link = this.$('.c-chart-interpolation[type="cardinal"]');
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.representation = 'line';
            this.interpolation = 'cardinal';
            this.offset = 'value';
            this.unstacked = true;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartScatter: function () {
        var link = this.$('.c-chart-representation[type="scatter"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var representations = $('.c-chart-representation');
            representations.not(link).attr('state', 'off');
            link = this.$('.c-chart-offset[type="value"]');
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');
            link = this.$('.c-chart-interpolation[type="step"]');
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.representation = 'scatterplot';
            this.interpolation = 'step';
            this.offset = 'value';
            this.unstacked = true;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartStacked: function () {
        var link = this.$('.c-chart-offset[type="stacked"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');

            this.offset = 'zero';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartStream: function () {
        var link = this.$('.c-chart-offset[type="stream"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');

            this.offset = 'wiggle';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartPercent: function () {
        var link = this.$('.c-chart-offset[type="percent"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');

            this.offset = 'expand';
            this.unstacked = false;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartValue: function () {
        var link = this.$('.c-chart-offset[type="value"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var offsets = $('.c-chart-offset');
            offsets.not(link).attr('state', 'off');

            this.offset = 'value';
            this.unstacked = true;
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartCardinal: function () {
        var link = this.$('.c-chart-interpolation[type="cardinal"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.interpolation = 'cardinal';
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartLinear: function () {
        var link = this.$('.c-chart-interpolation[type="linear"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.interpolation = 'linear';
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    },

    toggleChartStep: function () {
        var link = this.$('.c-chart-interpolation[type="step"]'),
            config;
        if (link.attr('state') === 'on') {return;}
        else {
            link.attr('state', 'on');
            var interpolations = $('.c-chart-interpolation');
            interpolations.not(link).attr('state', 'off');

            this.interpolation = 'step';
            config = {
                renderer: this.representation,
                interpolation: this.interpolation,
                offset: this.offset
            };
            cinema.events.trigger('toggle-chart-appearance', { config: config, unstacked: this.unstacked });
        }
    }

});
