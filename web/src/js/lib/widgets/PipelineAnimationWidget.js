cinema.views.PipelineAnimationWidget = Backbone.View.extend({
    events: {

        'change .c-pipeline-animation-slider-phi': 'changePhi',

        'change .c-pipeline-animation-slider-theta': 'changeTheta',

        'change .c-pipeline-animation-slider-time': 'changeTime',

        'click .c-pipeline-time-back': 'timeBack',

        'click .c-pipeline-time-end': 'timeEnd',

        'click .c-pipeline-time-next': 'timeForward',

        'click .c-pipeline-time-start': 'timeStart',

        'click .c-pipeline-phi-back': 'phiBack',

        'click .c-pipeline-phi-end': 'phiEnd',

        'click .c-pipeline-phi-next': 'phiForward',

        'click .c-pipeline-phi-start': 'phiStart',

        'click .c-pipeline-theta-back': 'thetaBack',

        'click .c-pipeline-theta-end': 'thetaEnd',

        'click .c-pipeline-theta-next': 'thetaForward',

        'click .c-pipeline-theta-start': 'thetaStart'

    },

    initialize: function (settings) {
        this.listenTo(this.model, 'change', function (){
            this.defaultTime = this.model.get('');
        });
    },

    render: function () {
        this.defaultTime = this.model.defaultTime();
        this.initialTime = this.model.initialTime();
        this.lengthTime = this.model.lengthTime();
        this.defaultPhi = this.model.defaultPhi();
        this.initialPhi = this.model.initialPhi();
        this.lengthPhi = this.model.lengthPhi();
        this.defaultTheta = this.model.defaultTheta();
        this.initialTheta = this.model.initialTheta();
        this.lengthTheta = this.model.lengthTheta();

        this.$el.html(cinema.templates.pipelineAnimation({
            defaultTime: this.defaultTime,
            initialTime: this.initialTime,
            minTime: 0,
            maxTime: this.lengthTime,
            stepTime: 1,
            defaultPhi: this.defaultPhi,
            initialPhi: this.initialPhi,
            minPhi: 0,
            maxPhi: this.lengthPhi,
            stepPhi: 1,
            defaultTheta: this.defaultTheta,
            initialTheta: this.initialTheta,
            minTheta: 0,
            maxTheta: this.lengthTheta,
            stepTheta: 1
        }));
    },

    changePhi: function (e) {
        var link = e.currentTarget;
        var value = this.model.getPhi(link.value);
        this.trigger('c:phi.viewpoint.show', value);
        this.updatePhiLabel(value);
    },

    changeTheta: function (e) {
        var link = e.currentTarget;
        var value = this.model.getTheta(link.value);
        this.trigger('c:theta.viewpoint.show', value);
        this.updateThetaLabel(value);
    },

    changeTime: function (e) {
        var link = e.currentTarget;
        var value = this.model.getTime(link.value);
        this.trigger('c:time.viewpoint.show', value);
        this.updateTimeLabel(value);
    },

    timeBack: function () {
        var slider = $('.c-pipeline-animation-slider-time');
        var currentValue = parseInt(slider.attr('value'));
        if (currentValue != 0) {
            currentValue = currentValue - 1;
            slider.attr('value', currentValue);
            slider.val(currentValue);
            var value = this.model.getTime(currentValue);
            this.trigger('c:time.viewpoint.show', value);
            this.updateTimeLabel(value);
        }
    },

    timeEnd: function () {
        var slider = $('.c-pipeline-animation-slider-time');
        if (slider.value != this.lengthTime) {
            slider.attr('value', this.lengthTime);
            slider.val(this.lengthTime);
            var value = this.model.getTime(this.lengthTime);
            this.trigger('c:time.viewpoint.show', value);
            this.updateTimeLabel(value);
        }
    },

    timeForward: function () {
        var slider = $('.c-pipeline-animation-slider-time');
        var currentValue = parseInt(slider.attr('value'));
        if (currentValue != this.lengthTime) {
            currentValue = currentValue + 1;
            slider.attr('value', currentValue);
            slider.val(currentValue);
            var value = this.model.getTime(currentValue);
            this.trigger('c:time.viewpoint.show', value);
            this.updateTimeLabel(value);
        }
    },

    timeStart: function () {
        var slider = $('.c-pipeline-animation-slider-time');
        if (slider.value != 0) {
            slider.attr('value', 0);
            slider.val(0);
            var value = this.model.getTime(0);
            this.trigger('c:time.viewpoint.show', value);
            this.updateTimeLabel(value);
        }
    },

    phiBack: function () {
        var slider = $('.c-pipeline-animation-slider-phi');
        var currentValue = parseInt(slider.attr('value'));
        if (currentValue != 0) {
            currentValue = currentValue - 1;
            slider.attr('value', currentValue);
            slider.val(currentValue);
            var value = this.model.getPhi(currentValue);
            this.trigger('c:phi.viewpoint.show', value);
            this.updatePhiLabel(value);
        }
    },

    phiEnd: function () {
        var slider = $('.c-pipeline-animation-slider-phi');
        if (slider.value != this.lengthPhi) {
            slider.attr('value', this.lengthPhi);
            slider.val(this.lengthPhi);
            var value = this.model.getPhi(this.lengthPhi);
            this.trigger('c:phi.viewpoint.show', value);
            this.updatePhiLabel(value);
        }
    },

    phiForward: function () {
        var slider = $('.c-pipeline-animation-slider-phi');
        var currentValue = parseInt(slider.attr('value'));
        if (currentValue != this.lengthPhi) {
            currentValue = currentValue + 1;
            slider.attr('value', currentValue);
            slider.val(currentValue);
            var value = this.model.getPhi(currentValue);
            this.trigger('c:phi.viewpoint.show', value);
            this.updatePhiLabel(value);
        }
    },

    phiStart: function () {
        var slider = $('.c-pipeline-animation-slider-phi');
        if (slider.value != 0) {
            slider.attr('value', 0);
            slider.val(0);
            var value = this.model.getPhi(0);
            this.trigger('c:phi.viewpoint.show', value);
            this.updatePhiLabel(value);
        }
    },

    thetaBack: function () {
        var slider = $('.c-pipeline-animation-slider-theta');
        var currentValue = parseInt(slider.attr('value'));
        if (currentValue != 0) {
            currentValue = currentValue - 1;
            slider.attr('value', currentValue);
            slider.val(currentValue);
            var value = this.model.getTheta(currentValue);
            this.trigger('c:theta.viewpoint.show', value);
            this.updateThetaLabel(value);
        }
    },

    thetaEnd: function () {
        var slider = $('.c-pipeline-animation-slider-theta');
        if (slider.value != this.lengthTheta) {
            slider.attr('value', this.lengthTheta);
            slider.val(this.lengthTheta);
            var value = this.model.getTheta(this.lengthTheta);
            this.trigger('c:theta.viewpoint.show', value);
            this.updateThetaLabel(value);
        }
    },

    thetaForward: function () {
        var slider = $('.c-pipeline-animation-slider-theta');
        var currentValue = parseInt(slider.attr('value'));
        if (currentValue != this.lengthTheta) {
            currentValue = currentValue + 1;
            slider.attr('value', currentValue);
            slider.val(currentValue);
            var value = this.model.getTheta(currentValue);
            this.trigger('c:theta.viewpoint.show', value);
            this.updateThetaLabel(value);
        }
    },

    thetaStart: function () {
        var slider = $('.c-pipeline-animation-slider-theta');
        if (slider.value != 0) {
            slider.attr('value', 0);
            slider.val(0);
            var value = this.model.getTheta(0);
            this.trigger('c:theta.viewpoint.show', value);
            this.updateThetaLabel(value);
        }
    },

    updatePhiLabel: function (value) {
        var label = $("#PipelineAnimationLabelPhi");
        label.text(value);
    },

    updateThetaLabel: function (value) {
        var label = $("#PipelineAnimationLabelTheta");
        label.text(value);
    },

    updateTimeLabel: function (value) {
        var label = $("#PipelineAnimationLabelTime");
        label.text(value);
    }

});
