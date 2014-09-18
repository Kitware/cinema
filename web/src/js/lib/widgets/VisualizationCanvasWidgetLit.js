//Vector math from http://evanw.github.io/lightgl.js/docs/vector.html
function Vector(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector.prototype = {
  negative: function() {
    return new Vector(-this.x, -this.y, -this.z);
  },
  add: function(v) {
    if (v instanceof Vector) return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    else return new Vector(this.x + v, this.y + v, this.z + v);
  },
  subtract: function(v) {
    if (v instanceof Vector) return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
    else return new Vector(this.x - v, this.y - v, this.z - v);
  },
  multiply: function(v) {
    if (v instanceof Vector) return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
    else return new Vector(this.x * v, this.y * v, this.z * v);
  },
  divide: function(v) {
    if (v instanceof Vector) return new Vector(this.x / v.x, this.y / v.y, this.z / v.z);
    else return new Vector(this.x / v, this.y / v, this.z / v);
  },
  equals: function(v) {
    return this.x == v.x && this.y == v.y && this.z == v.z;
  },
  dot: function(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },
  cross: function(v) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  },
  length: function() {
    return Math.sqrt(this.dot(this));
  },
  unit: function() {
    return this.divide(this.length());
  },
  min: function() {
    return Math.min(Math.min(this.x, this.y), this.z);
  },
  max: function() {
    return Math.max(Math.max(this.x, this.y), this.z);
  },
  toAngles: function() {
    return {
      theta: Math.atan2(this.z, this.x),
      phi: Math.asin(this.y / this.length())
    };
  },
  toArray: function(n) {
    return [this.x, this.y, this.z].slice(0, n || 3);
  },
  clone: function() {
    return new Vector(this.x, this.y, this.z);
  },
  init: function(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    return this;
  }
};

Vector.negative = function(a, b) {
  b.x = -a.x; b.y = -a.y; b.z = -a.z;
  return b;
};
Vector.add = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x + b.x; c.y = a.y + b.y; c.z = a.z + b.z; }
  else { c.x = a.x + b; c.y = a.y + b; c.z = a.z + b; }
  return c;
};
Vector.subtract = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x - b.x; c.y = a.y - b.y; c.z = a.z - b.z; }
  else { c.x = a.x - b; c.y = a.y - b; c.z = a.z - b; }
  return c;
};
Vector.multiply = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x * b.x; c.y = a.y * b.y; c.z = a.z * b.z; }
  else { c.x = a.x * b; c.y = a.y * b; c.z = a.z * b; }
  return c;
};
Vector.divide = function(a, b, c) {
  if (b instanceof Vector) { c.x = a.x / b.x; c.y = a.y / b.y; c.z = a.z / b.z; }
  else { c.x = a.x / b; c.y = a.y / b; c.z = a.z / b; }
  return c;
};
Vector.cross = function(a, b, c) {
  c.x = a.y * b.z - a.z * b.y;
  c.y = a.z * b.x - a.x * b.z;
  c.z = a.x * b.y - a.y * b.x;
  return c;
};
Vector.unit = function(a, b) {
  var length = a.length();
  b.x = a.x / length;
  b.y = a.y / length;
  b.z = a.z / length;
  return b;
};
Vector.fromAngles = function(theta, phi) {
  return new Vector(Math.cos(theta) * Math.cos(phi), Math.sin(phi), Math.sin(theta) * Math.cos(phi));
};
Vector.randomDirection = function() {
  return Vector.fromAngles(Math.random() * Math.PI * 2, Math.asin(Math.random() * 2 - 1));
};
Vector.min = function(a, b) {
  return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
};
Vector.max = function(a, b) {
  return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
};
Vector.lerp = function(a, b, fraction) {
  return b.subtract(a).multiply(fraction).add(a);
};
Vector.fromArray = function(a) {
  return new Vector(a[0], a[1], a[2]);
};


/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 */
cinema.views.VisualizationCanvasWidgetLit = cinema.views.VisualizationCanvasWidget.extend({

    _RainbowColor: function(value)
    {
        var i = value;
        var r = Math.round(Math.sin(0.024 * i * 255 + 0) * 127 + 128);
        var g = Math.round(Math.sin(0.024 * i * 255 + 2) * 127 + 128);
        var b = Math.round(Math.sin(0.024 * i * 255 + 4) * 127 + 128);
        return [r, g, b];
    },

    _privateInit: function (settings) {
        this.light = new Vector(1,0,0);
        this.LUT = this._RainbowColor;
        this.lightColor = new Vector(1,1,1);
        this.lightTerms = { ka: 0.1, kd: 0.6, ks: 0.3, alpha: 20.0 };
    },

    setLight: function(_light) {
        this.light = Vector.fromArray(_light).unit();
    },

    setLUT: function(_lut) {
        this.LUT = _lut;
    },

    setLightColor: function (lightColor) {
      this.lightColor = new Vector(lightColor[0], lightColor[1], lightColor[2]);
    },

    setLightTerms: function (terms) {
      this.lightTerms = terms;
    },

    _valueOfPixel: function(term, renderTerms) {
        var pR = renderTerms[term][0]
        var pG = renderTerms[term][1]
        var pB = renderTerms[term][2]
        var value = (pR<<16 | pG << 8 | pB)
        var toOne = value/16777216
        return toOne;
    },

    _realValueOfPixel: function(term, renderTerms) {
        var toOne = this._valueOfPixel(term, renderTerms)
        var min = this.model.attributes.metadata.ranges[term][0]
        var scale = this.model.attributes.metadata.ranges[term][1]-min
        var scaled = toOne*scale+min
        //scale and bias bases on metadata.ranges.term
        return scaled
    },

    _colorPixel: function (renderTerms) {

        if (renderTerms['canLight'] == true) {
            //Get all terms required for color of this pixel
            var nX = this._valueOfPixel('nX', renderTerms);
            var nY = this._valueOfPixel('nY', renderTerms);
            var nZ = this._valueOfPixel('nZ', renderTerms);
            var value = this._valueOfPixel(renderTerms['scalarArray'], renderTerms);

            //through LUT
            var toColor = value;
            var color = this.LUT(toColor);
            //return [color[0], color[1], color[2], 255]

            var Color = Vector.fromArray(color);

            //apply lighting
            var ka = this.lightTerms.ka;
            var lightColor = this.lightColor;
            var ambientTerm = ka;
            var ambientColor = lightColor.multiply(255).multiply(ka);
            //return [ambientColor.x, ambientColor.y, ambientColor.z, 255.0];

            //todo: foreach light
            var lightPosition = this.light;
            var normal = new Vector(nX,nY,nZ).unit();
            var kd = this.lightTerms.kd;
            var diffuseTerm = kd * lightPosition.dot(normal);
            var diffuseColor = lightColor.multiply(Color.multiply(diffuseTerm));
            //return [diffuseColor.x, diffuseColor.y, diffuseColor.z, 255];

            //todo: foreach light
            var viewPosition = new Vector(0,0,1);//ensure normalized
            var R = normal.multiply(2.0*lightPosition.dot(normal)).subtract(lightPosition);
            var ks = this.lightTerms.ks;
            var alpha = this.lightTerms.alpha;
            var specularTerm = ks*Math.pow(R.dot(viewPosition), alpha)
            //var specularColor = lightColor.multiply(Color.multiply(specularTerm))
            var specularColor = lightColor.multiply(specularTerm*255)
            //return [specularColor.x, specularColor.y, specularColor.z, 255];

            var phongcolor = ambientColor.add(diffuseColor.add(specularColor));
            var litcolor = [phongcolor.x,phongcolor.y,phongcolor.z,255.0]
            return litcolor;
        }

        //otherwise fall back to old behavior
        return [renderTerms.layer[0],
                renderTerms.layer[1],
                renderTerms.layer[2],
                255.0];
    },


    /**
     * Computes the composite image and writes it into the composite buffer.
     * @param data The payload from the composite image manager c:data.ready
     * callback. This will write computed composite data back into that
     * cache entry so it won't have to recompute it.
     */
    _writeCompositeBuffer: function (data) {
        if (!_.has(this.compositeCache, data.key)) {
            this._computeCompositeInfo(data);
        }

        var renderCanvas = this.$('.c-vis-render-canvas')[0],
            compositeCanvas = this.$('.c-vis-composite-buffer')[0],
            spriteCanvas = this.$('.c-vis-spritesheet-buffer')[0],
            dim = this.model.imageDimensions(),
            spritesheetDim = this.model.spritesheetDimensions(),
            spriteCtx = spriteCanvas.getContext('2d'),
            compositeCtx = compositeCanvas.getContext('2d'),
            composite = this.compositeCache[data.key];

        $(spriteCanvas).attr({
            width: spritesheetDim[0],
            height: spritesheetDim[1]
        });
        $(compositeCanvas).attr({
            width: dim[0],
            height: dim[1]
        });

        // Fill full spritesheet buffer with raw image data
        spriteCtx.drawImage(data.image, 0, 0);

        var pixelBuffer = spriteCtx.getImageData(0, 0,
                  spritesheetDim[0], spritesheetDim[1]).data,
            frontBuffer,
            pixelIdx = 0;

        // Fill the background if backgroundColor is specified
        if (this.backgroundColor) {
            compositeCtx.fillStyle = this.backgroundColor;
            compositeCtx.fillRect(0, 0, dim[0], dim[1]);
            frontBuffer = compositeCtx.getImageData(0, 0, dim[0], dim[1]);
        } else { // Otherwise use the bottom spritesheet image as a background
            frontBuffer = spriteCtx.getImageData(
                0, (this.model.numberOfLayers() - 1) * dim[1], dim[0], dim[1]);
        }


        var frontPixels = frontBuffer.data;

        var renderTerms = {};
        var isize = dim[0] * dim[1] * 4;

        //find terms and indexes into the sprite map for things we use for lighting
        //(namely normals and scalar array of our choice)
        //if we find them we set canLight and populate
        //lightTermsOffsets to have start address into spritemap for each layer
        var canLight = false;
        var lightTermsOffsets = {}
        var pnX = -1, pnY = -1, pnZ = -1, pV = -1;
        var scalarArray = 'vRTData'; //pick any array we have values for
        renderTerms['scalarArray'] = scalarArray;
        var p = this.model.attributes.metadata.fields;
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                if (p[key] == 'nX') {
                    pnX = key;
                }
                if (p[key] == 'nY') {
                    pnY = key;
                }
                if (p[key] == 'nZ') {
                    pnZ = key;
                }
                if (p[key] == scalarArray) {
                    pV = key;
                }
            }
        }
        if (pnX != -1 && pnY != -1 && pnZ != -1 && pV != -1) {
            canLight = true;
            p = this.model.attributes.metadata.offset;
            for (var key in p) {
                if (p.hasOwnProperty(key)) {
                    var layer = key.substr(0,1);
                    var field = key.substr(1,1);
                    var offset = (this.model.numberOfLayers() - 1 - p[key])*isize;
                    if (field === pnX) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer]['nX'] = offset;
                        } else {
                            lightTermsOffsets[layer] = {'nX':offset};
                        }
                    }
                    if (field === pnY) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer]['nY'] = offset;
                        } else {
                            lightTermsOffsets[layer] = {'nY':offset};
                        }
                    }
                    if (field === pnZ) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer]['nZ'] = offset;
                        } else {
                            lightTermsOffsets[layer] = {'nZ':offset};
                        }
                    }
                    if (field === pV) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer][scalarArray] = offset;
                        } else {
                            lightTermsOffsets[layer] = {scalarArray:offset};
                        }
                    }
                }
            }
        }

        for (var i = 0; i < composite.length; i += 1) {
            var order = composite[i];

            if (order > 0) {
                pixelIdx += order;
            } else {
                var offset = this.orderMapping[order];
                if (offset > -1) {

                    var localIdx = 4 * pixelIdx;
                    offset *= isize;
                    offset += localIdx;

                    renderTerms['layer'] = [pixelBuffer[offset+0],pixelBuffer[offset+1],pixelBuffer[offset+2]];

                    renderTerms['canLight'] = false;
                    if (canLight) {
                        //does this layer have lighting parameters?
                        var layer = order.substr(0,1)
                        if (layer in lightTermsOffsets) {
                            //yes
                            var Offsets = {
                                'nX': lightTermsOffsets[layer]['nX'],
                                'nY': lightTermsOffsets[layer]['nY'],
                                'nZ': lightTermsOffsets[layer]['nZ'],
                            }
                            Offsets[scalarArray] = lightTermsOffsets[layer][scalarArray]

                            renderTerms['nX'] = [
                                pixelBuffer[Offsets.nX+localIdx+0],
                                pixelBuffer[Offsets.nX+localIdx+1],
                                pixelBuffer[Offsets.nX+localIdx+2]];
                            renderTerms['nY'] = [
                                pixelBuffer[Offsets.nY+localIdx+0],
                                pixelBuffer[Offsets.nY+localIdx+1],
                                pixelBuffer[Offsets.nY+localIdx+2]];
                            renderTerms['nZ'] = [
                                pixelBuffer[Offsets.nZ+localIdx+0],
                                pixelBuffer[Offsets.nZ+localIdx+1],
                                pixelBuffer[Offsets.nZ+localIdx+2]];
                            renderTerms[scalarArray] = [
                                pixelBuffer[Offsets[scalarArray]+localIdx+0],
                                pixelBuffer[Offsets[scalarArray]+localIdx+1],
                                pixelBuffer[Offsets[scalarArray]+localIdx+2]];
                            renderTerms['canLight'] = true;
                        }
                    }

                    var frontColor = this._colorPixel(renderTerms);

                    frontPixels[localIdx] = frontColor[0];
                    frontPixels[localIdx + 1] = frontColor[1];
                    frontPixels[localIdx + 2] = frontColor[2];
                    frontPixels[localIdx + 3] = frontColor[3];
                }
                pixelIdx += 1;
            }
        }

        // Draw buffer to composite canvas
        compositeCtx.putImageData(frontBuffer, 0, 0);
    },

    forceRedraw: function () {
        this._viewpoint.phi = "NONSENSE";
        this.showViewpoint();
    },


});
