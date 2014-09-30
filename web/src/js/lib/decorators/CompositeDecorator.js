(function () {
    cinema.decorators.Composite = function (rootModel) {
        return _.extend(rootModel, this);
    };

    var prototype = cinema.decorators.Composite.prototype;

    // Public methods ---------------------------------------------------------

    prototype.getSpriteSize = function () {
        if (!this._spriteSize) {
            this._spriteSize = 0;
            var that = this;
            _.each(this.getOffset(), function(value, key) {
                that._spriteSize = (that._spriteSize < value) ? value : that._spriteSize;
            });
        }
        return this._spriteSize;
    };

    prototype.getOffset = function () {
        return this.get('metadata').offset;
    };

    prototype.getImageSize = function () {
        return this.get('metadata').dimensions;
    };

    prototype.getSpriteImageSize = function () {
        var baseSize = this.getImageSize();
        return [ baseSize[0], baseSize[1] * this.getSpriteSize() ];
    };

    prototype.getDefaultPipelineSetup = function () {
        // Not stored currently in data model
        return '';
    };
}());
