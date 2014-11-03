cinema.views.StaticInformationWidget = Backbone.View.extend({

    initialize: function (settings) {
        this.model = settings.model;
        this.analysisInfo = settings.analysisInfo;

        this.namingPattern = '';
        for (var idx = 0; idx < this.analysisInfo.information.length; idx+=1) {
            this.namingPattern += '{' + (idx + 1) + '}-';
        }
        this.namingPattern = this.namingPattern.slice(0, this.namingPattern.length - 1);
    },

    render: function () {
        this.$el.html(cinema.templates.staticInformation({
            namingPattern: this.namingPattern,
            analysis: this.analysisInfo
        }));
    }

});
