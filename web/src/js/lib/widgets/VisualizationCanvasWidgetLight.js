/**
 * This widget renders the visualization defined by a VisualizationModel onto
 * a canvas element that will fill the parent element.
 */
cinema.views.VisualizationCanvasWidgetLight = cinema.views.VisualizationCanvasWidget.extend({

    _RainbowColor: function (value)
    {
        var i = value;
        var r = Math.round(Math.sin(0.024 * i * 255 + 0) * 127 + 128);
        var g = Math.round(Math.sin(0.024 * i * 255 + 2) * 127 + 128);
        var b = Math.round(Math.sin(0.024 * i * 255 + 4) * 127 + 128);
        return [r, g, b];
    },

    _privateInit: function (settings) {
        this.lightPosition = [-1, 1, 0];
        this.worldLight = new Vector(-1, 0, 1);
        this.LUT = this._RainbowColor;
        this.lightColor = new Vector(1, 1, 1);
        this.lightTerms = { ka: 0.1, kd: 0.6, ks: 0.3, alpha: 20.0 };
        this._forceRedraw = false;
        this.eye = new Vector(0, 0, 1);
        /*
        for (var phi=0; phi <= 360; phi+=30) {
            var res = this._spherical2CartesianN(phi, 45.0);
            //console.log("?", phi, 45.0, " : ", res[0].toFixed(3), res[1].toFixed(3), res[2].toFixed(3));
        }
        for (var theta=0; theta <= 180; theta+=30) {
            var res = this._spherical2CartesianN(270.0, theta);
            //console.log("?",270.0, theta, " : ", res[0].toFixed(3), res[1].toFixed(3), res[2].toFixed(3));
        }
        */
    },

    _spherical2CartesianN: function (phi, theta) {
        var phiRad = (180.0 - phi) * Math.PI / 180.0;
        var thetaRad = (180.0 - theta) * Math.PI / 180.0;
        var x = Math.sin(thetaRad) * Math.cos(phiRad);
        var y = Math.sin(thetaRad) * Math.sin(phiRad);
        var z = Math.cos(thetaRad);
        return [x, y, z];
    },

    _spherical2Cartesian: function (phi, theta) {
        return this._spherical2CartesianN(parseFloat(phi), parseFloat(theta));
    },

    _recomputeLight: function () {
        //console.log("LIGHT", this.lightPosition[0].toFixed(3), this.lightPosition[1].toFixed(3), this.lightPosition[2].toFixed(3));

        //find eye point
        //console.log("PT", this._viewpoint.phi, this._viewpoint.theta);
        this.eye = Vector.fromArray(this._spherical2Cartesian(this.controlModel.getControl('phi'), this.controlModel.getControl('theta'))).unit();
        //console.log("EYE", this.eye.x.toFixed(3), this.eye.y.toFixed(3), this.eye.z.toFixed(3));

        //this.worldlight = this.eye;
        //console.log("WLIGHT", this.worldlight.x.toFixed(3), this.worldlight.y.toFixed(3), this.worldlight.z.toFixed(3));
        //return;

        //construct a coordinate system relative to eye point
        var at = new Vector(0, 0, 0); //assumption always looking at 0
        var aprox_up = this.eye.add(new Vector(0, 0, 1)).unit(); //assumption, north is always up

        var t0 = at.subtract(this.eye);
        var t1 = aprox_up.subtract(this.eye);
        var right = t0.cross(t1).unit();

        t0 = right.subtract(this.eye);
        t1 = at.subtract(this.eye);
        var up = t0.cross(t1).unit();
        //console.log("RIGHT", right.x.toFixed(3), right.y.toFixed(3), right.z.toFixed(3));
        //console.log("UP", up.x.toFixed(3), up.y.toFixed(3), up.z.toFixed(3));

        //scale down so we can alway have room before normalization
        var rm = right.multiply(this.lightPosition[0] * 0.3);
        //console.log("rm", rm.x.toFixed(3), rm.y.toFixed(3), rm.z.toFixed(3));
        var um = up.multiply(this.lightPosition[1] * 0.3);
        //console.log("um", um.x.toFixed(3), um.y.toFixed(3), um.z.toFixed(3));

        this.worldlight = this.eye.multiply(0.3).add(rm).add(um).unit();
        //console.log("WLIGHT", this.worldlight.x.toFixed(3), this.worldlight.y.toFixed(3), this.worldlight.z.toFixed(3));
    },

    setLight: function (_light) {
        if (this.lightPosition !== _light) {
            this.lightPosition = _light;
        }
    },

    setLUT: function (_lut) {
        this.LUT = _lut;
    },

    setLightColor: function (lightColor) {
        this.lightColor = new Vector(lightColor[0], lightColor[1], lightColor[2]);
    },

    setLightTerms: function (terms) {
        this.lightTerms = terms;
    },

    _valueOfPixel: function (term, renderTerms) {
        var pR = renderTerms[term][0],
            pG = renderTerms[term][1],
            pB = renderTerms[term][2],
            // value = (pR << 16 | pG << 8 | pB),
            value = (pR * 65536 + pG * 256 + pB),
            toOne = value / 16777216;
        return toOne;
    },

    _realValueOfPixel: function (term, renderTerms) {
        var toOne = this._valueOfPixel(term, renderTerms),
            min = this.model.attributes.metadata.ranges[term][0],
            scale = this.model.attributes.metadata.ranges[term][1] - min,
            scaled = toOne * scale + min;
        //scale and bias bases on metadata.ranges.term
        return scaled;
    },

    _colorPixel: function (renderTerms) {

        if (renderTerms.canLight) {
            //Get all terms required for color of this pixel
            var nX = this._realValueOfPixel('nX', renderTerms),
                nY = this._realValueOfPixel('nY', renderTerms),
                nZ = this._realValueOfPixel('nZ', renderTerms),
                value = this._valueOfPixel(renderTerms.scalarArray, renderTerms);

            //to debug normals, use this
            return [(nX+1)*128,(nY+1)*128,(nZ+1)*128,255];

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
            var lightPosition = this.worldlight;
            var normal = new Vector(nX, nY, nZ).unit();

            var kd = this.lightTerms.kd;
            var diffuseTerm = kd * lightPosition.dot(normal);
            var diffuseColor = Color.multiply(diffuseTerm);
            //return [diffuseColor.x, diffuseColor.y, diffuseColor.z, 255];

            //todo: foreach light
            var viewPosition = this.eye;
            var R = normal.multiply(2.0 * lightPosition.dot(normal)).subtract(lightPosition);
            var ks = this.lightTerms.ks;
            var alpha = this.lightTerms.alpha;
            var specularTerm = ks * Math.pow(R.dot(viewPosition), alpha);
            var specularColor = lightColor.multiply(specularTerm * 255);
            //return [specularColor.x, specularColor.y, specularColor.z, 255];

            var phongcolor = ambientColor.add(diffuseColor.add(specularColor));
            var litcolor = [phongcolor.x, phongcolor.y, phongcolor.z, 255.0];
            return litcolor;
        }

        //otherwise fall back to old behavior
        return [renderTerms.layer[0],
                renderTerms.layer[1],
                renderTerms.layer[2],
                255.0];
    },

    _findLayer: function (order) {
        //todo: precompue like computeCompositeOffset does
        for (var i = 0; i < order.length; i += 1) {
            var offset = this.layerOffset[order[i]];
            if (offset > -1) {
                return order[i];
            }
        }
        return -1;
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

        var layer,
            renderCanvas = this.$('.c-vis-render-canvas')[0],
            compositeCanvas = this.$('.c-vis-composite-buffer')[0],
            spriteCanvas = this.$('.c-vis-spritesheet-buffer')[0],
            dim = this.model.getImageSize(),
            spritesheetDim = this.model.getSpriteImageSize(),
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
                0, this.model.getSpriteSize() * dim[1], dim[0], dim[1]);
        }


        var frontPixels = frontBuffer.data;

        var renderTerms = {};
        var isize = dim[0] * dim[1] * 4;

        //find terms and indexes into the sprite map for things we use for lighting
        //(namely normals and scalar array of our choice)
        //if we find them we set canLight and populate
        //lightTermsOffsets to have start address into spritemap for each layer
        var canLight = false;
        var lightTermsOffsets = {};
        var pnX = -1, pnY = -1, pnZ = -1, pV = -1;
        var scalarArray = 'vRTData'; //pick any array we have values for
        renderTerms.scalarArray = scalarArray;
        var p = this.model.attributes.metadata.fields;
        for (var key in p) {
            if (p.hasOwnProperty(key)) {
                if (p[key] === 'nX') {
                    pnX = key;
                }
                if (p[key] === 'nY') {
                    pnY = key;
                }
                if (p[key] === 'nZ') {
                    pnZ = key;
                }
                if (p[key] === scalarArray) {
                    pV = key;
                }
            }
        }
        if (pnX !== -1 && pnY !== -1 && pnZ !== -1 && pV !== -1) {
            canLight = true;
            p = this.model.attributes.metadata.offset;
            for (var k in p) {
                if (p.hasOwnProperty(k)) {
                    layer = k.substr(0, 1);
                    var field = k.substr(1, 1);
                    var offset = (this.model.getSpriteSize() - p[k]) * isize;
                    if (field === pnX) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer].nX = offset;
                        } else {
                            lightTermsOffsets[layer] = {'nX': offset};
                        }
                    }
                    if (field === pnY) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer].nY = offset;
                        } else {
                            lightTermsOffsets[layer] = {'nY': offset};
                        }
                    }
                    if (field === pnZ) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer].nZ = offset;
                        } else {
                            lightTermsOffsets[layer] = {'nZ': offset};
                        }
                    }
                    if (field === pV) {
                        if (lightTermsOffsets[layer]) {
                            lightTermsOffsets[layer][scalarArray] = offset;
                        } else {
                            lightTermsOffsets[layer] = { scalarArray: offset };
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
                var orderOffset = this.orderMapping[order];
                if (orderOffset > -1) {

                    var localIdx = 4 * pixelIdx;
                    orderOffset *= isize;
                    orderOffset += localIdx;

                    renderTerms.layer = [ pixelBuffer[orderOffset + 0], pixelBuffer[orderOffset + 1], pixelBuffer[orderOffset + 2] ];

                    renderTerms.canLight = false;
                    if (canLight) {
                        //does this layer have lighting parameters?
                        layer = this._findLayer(order);
                        if (layer in lightTermsOffsets) {
                            //yes
                            var Offsets = {
                                'nX': lightTermsOffsets[layer].nX,
                                'nY': lightTermsOffsets[layer].nY,
                                'nZ': lightTermsOffsets[layer].nZ
                            };
                            Offsets[scalarArray] = lightTermsOffsets[layer][scalarArray];

                            renderTerms.nX = [
                                pixelBuffer[Offsets.nX + localIdx + 0],
                                pixelBuffer[Offsets.nX + localIdx + 1],
                                pixelBuffer[Offsets.nX + localIdx + 2]
                            ];
                            renderTerms.nY = [
                                pixelBuffer[Offsets.nY + localIdx + 0],
                                pixelBuffer[Offsets.nY + localIdx + 1],
                                pixelBuffer[Offsets.nY + localIdx + 2]
                            ];
                            renderTerms.nZ = [
                                pixelBuffer[Offsets.nZ + localIdx + 0],
                                pixelBuffer[Offsets.nZ + localIdx + 1],
                                pixelBuffer[Offsets.nZ + localIdx + 2]
                            ];
                            renderTerms[scalarArray] = [
                                pixelBuffer[Offsets[scalarArray] + localIdx + 0],
                                pixelBuffer[Offsets[scalarArray] + localIdx + 1],
                                pixelBuffer[Offsets[scalarArray] + localIdx + 2]
                            ];
                            renderTerms.canLight = true;
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
        if (this._forceRedraw || changed) {
            changed = true;
            this._forceRedraw = false;
            this._recomputeLight();
        }
        if (changed) {
            this.compositeManager.downloadData(this._controls);
        } else {
            this.drawImage();
        }
        return this;
    },


    forceRedraw: function () {
        this._forceRedraw = true;
        this.showViewpoint();
    }

});
