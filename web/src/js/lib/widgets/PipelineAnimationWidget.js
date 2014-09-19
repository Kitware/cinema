cinema.views.PipelineAnimationWidget = Backbone.View.extend({
    events: {

        'input .c-pipeline-animation-time .c-pipeline-animation-slider': function (e) {
            this.change('time', e.currentTarget.value);
        },

        'input .c-pipeline-animation-phi .c-pipeline-animation-slider': function (e) {
            this.change('phi', e.currentTarget.value);
        },

        'input .c-pipeline-animation-theta .c-pipeline-animation-slider': function (e) {
            this.change('theta', e.currentTarget.value);
        },

        'click .c-pipeline-animation-time .c-pipeline-back': function (e) {
            this.increment('time', -1);
        },

        'click .c-pipeline-animation-phi .c-pipeline-back': function (e) {
            this.increment('phi', -1);
        },

        'click .c-pipeline-animation-theta .c-pipeline-back': function (e) {
            this.increment('theta', -1);
        },

        'click .c-pipeline-animation-time .c-pipeline-next': function (e) {
            this.increment('time', 1);
        },

        'click .c-pipeline-animation-phi .c-pipeline-next': function (e) {
            this.increment('phi', 1);
        },

        'click .c-pipeline-animation-theta .c-pipeline-next': function (e) {
            this.increment('theta', 1);
        },

        'click .c-pipeline-animation-time .c-pipeline-end': function (e) {
            this.end('time');
        },

        'click .c-pipeline-animation-phi .c-pipeline-end': function (e) {
            this.end('phi');
        },

        'click .c-pipeline-animation-theta .c-pipeline-end': function (e) {
            this.end('theta');
        },

        'click .c-pipeline-animation-time .c-pipeline-start': function (e) {
            this.start('time');
        },

        'click .c-pipeline-animation-phi .c-pipeline-start': function (e) {
            this.start('phi');
        },

        'click .c-pipeline-animation-theta .c-pipeline-start': function (e) {
            this.start('theta');
        }
    },

    initialize: function (settings) {
        if (!settings.viewport) {
            throw "Animation widget requires a viewport.";
        }
        this.camera = settings.viewport.camera;
        this.toolbarView = new cinema.views.ViewControlToolbar({el: settings.toolbarContainer});
        this.listenTo(this.model, 'change', function () {
            this.render();
        });
        this.listenTo(this.camera, 'change', this._refresh);
    },

    _formatLabel: function (val) {
        return Number(val).toFixed();
    },

    render: function () {
        this.$el.html(cinema.templates.pipelineAnimation({
            time: this._formatLabel(this.camera.time()),
            itime: this.camera.get('itime'),
            minTime: 0,
            maxTime: this.camera.times.length - 1,
            stepTime: 1,
            phi: this._formatLabel(this.camera.phi()),
            iphi: this.camera.get('iphi'),
            minPhi: 0,
            maxPhi: this.camera.phis.length - 1,
            stepPhi: 1,
            theta: this._formatLabel(this.camera.theta()),
            itheta: this.camera.get('itheta'),
            minTheta: 0,
            maxTheta: this.camera.thetas.length - 1,
            stepTheta: 1
        }));
        this.toolbarView.render();
    },

    _refresh: function () {
        ['time', 'phi', 'theta'].forEach(function (param) {
            var group = this.$('.c-pipeline-animation-' + param);
            group.find('label.c-pipeline-animation-label').text(
                this._formatLabel(this.camera[param]())
            );
            group.find('input.c-pipeline-animation-slider')
                .val(this.camera.get('i' + param));
        }.bind(this));
    },

    change: function (param, value) {
        this.camera.set('i' + param, Number(value));
        this._refresh();
    },

    increment: function (param, byValue) {
        this.camera.increment(param, byValue);
        this._refresh();
    },

    end: function (param) {
        this.camera.set('i' + param, this.camera[param + 's'].length - 1);
        this._refresh();
    },

    start: function (param) {
        this.camera.set('i' + param, 0);
        this._refresh();
    }
});
