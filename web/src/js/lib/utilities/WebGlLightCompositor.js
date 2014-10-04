
(function () {


  cinema.utilities.CreateWebGlLightCompositor = function() {

    var gl = 0,
    displayProgram = null,
    compositeProgram = null,
    compositeLightProgram = null,
    texCoordBuffer = 0,
    posCoordBuffer = 0,
    texture = 0,
    fbo = 0,
    renderTexture = 0,
    numSprites = 22,
    imgw = 500,
    imgh = 500,
    viewportWidth = 0,
    viewportHeight = 0,
    projection = null,
    mvp = null,
    glCanvas = null,
    initialized = false,
    lightingTextureNames = [ 'nx', 'ny', 'nz', 'scalars' ],
    lightingTextures = {};


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function init(imgSize, webglCanvas) {
      if (initialized === true) {
        cleanUpGlState();
      }

      initialized = true;

      imgw = imgSize[0];
      imgh = imgSize[1];
      viewportWidth = webglCanvas.width;
      viewportHeight = webglCanvas.height;
      glCanvas = webglCanvas;

      mvp = mat4.create();
      mat4.identity(mvp);

      projection = mat4.create();
      mat4.identity(projection);

      //Inialize GL context
      initGL();

      // Create a texture object
      createTextures();

      // Create vertex position and tex coord buffers
      initAttribBuffers();

      // Initialize the display program shaders
      displayProgram = createShaderProgram(loadShaderFiles('/shaders/vertex/displayVertex.c', '/shaders/fragment/displayFragment.c'));

      // look up where the vertex position coords need to go when using the display program
      gl.bindBuffer(gl.ARRAY_BUFFER, posCoordBuffer);
      displayProgram.positionLocation = gl.getAttribLocation(displayProgram, "a_position");
      gl.enableVertexAttribArray(displayProgram.positionLocation);
      gl.vertexAttribPointer(displayProgram.positionLocation, 2, gl.FLOAT, false, 0, 0);

      // ditto for vertex texture coords
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      displayProgram.texCoordLocation = gl.getAttribLocation(displayProgram, "a_texCoord");
      gl.enableVertexAttribArray(displayProgram.texCoordLocation);
      gl.vertexAttribPointer(displayProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // Initialize the compositing program shaders
      compositeProgram = createShaderProgram(loadShaderFiles('/shaders/vertex/compositeVertex.c', '/shaders/fragment/compositeFragment.c'));

      // look up where the vertex position coords need to go when using the compositing program
      gl.bindBuffer(gl.ARRAY_BUFFER, posCoordBuffer);
      compositeProgram.positionLocation = gl.getAttribLocation(compositeProgram, "a_position");
      gl.enableVertexAttribArray(compositeProgram.positionLocation);
      gl.vertexAttribPointer(compositeProgram.positionLocation, 2, gl.FLOAT, false, 0, 0);

      // ditto for vertex texture coords
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      compositeProgram.texCoordLocation = gl.getAttribLocation(compositeProgram, "a_texCoord");
      gl.enableVertexAttribArray(compositeProgram.texCoordLocation);
      gl.vertexAttribPointer(compositeProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // Initialize the compositing program shaders
      compositeLightProgram = createShaderProgram(loadShaderFiles('/shaders/vertex/compositeVertex.c', '/shaders/fragment/compositeLightFragment.c'));

      // look up where the vertex position coords need to go when using the compositing program
      gl.bindBuffer(gl.ARRAY_BUFFER, posCoordBuffer);
      compositeLightProgram.positionLocation = gl.getAttribLocation(compositeLightProgram, "a_position");
      gl.enableVertexAttribArray(compositeLightProgram.positionLocation);
      gl.vertexAttribPointer(compositeLightProgram.positionLocation, 2, gl.FLOAT, false, 0, 0);

      // ditto for vertex texture coords
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      compositeLightProgram.texCoordLocation = gl.getAttribLocation(compositeLightProgram, "a_texCoord");
      gl.enableVertexAttribArray(compositeLightProgram.texCoordLocation);
      gl.vertexAttribPointer(compositeLightProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // Create a framebuffer for rendering to texture
      var fboResult = initFrameBuffer();
      fbo = fboResult[0];
      renderTexture = fboResult[1];
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function cleanUpGlState() {
        // Clean up the display program and its shaders
        for (var i = 0; i < displayProgram.shaders.length; i+=1) {
          gl.deleteShader(displayProgram.shaders[i]);
        }
        gl.deleteProgram(displayProgram);

        // Clean up the composite program and its shaders
        for (var j = 0; j < compositeProgram.shaders.length; j+=1) {
          gl.deleteShader(compositeProgram.shaders[j]);
        }
        gl.deleteProgram(compositeProgram);

        // Clean up the composite light program and its shaders
        for (var j = 0; j < compositeLightProgram.shaders.length; j+=1) {
          gl.deleteShader(compositeLightProgram.shaders[j]);
        }
        gl.deleteProgram(compositeLightProgram);

        // Now clean up fbo, textures, and buffers
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(renderTexture);
        gl.deleteTexture(texture);
        gl.deleteBuffer(texCoordBuffer);
        gl.deleteBuffer(posCoordBuffer);

        for (var i = 0; i < lightingTextureNames.length; i+=1) {
          gl.deleteTexture(lightingTextures[lightingTextureNames[i]]);
        }
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function initGL() {
      // Get A WebGL context
      gl = glCanvas.getContext("experimental-webgl") || glCanvas.getContext("webgl");
      if (!gl) {
        return null;
      }
      // Set clear color to white, fully transparent
      gl.clearColor(1.0, 1.0, 1.0, 0.0);

      var vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      var fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      var combinedUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

      console.log("vertex texture image units: " + vertexUnits);
      console.log("fragment texture image units: " + fragmentUnits);
      console.log("combined texture image units: " + combinedUnits);
    }

    // --------------------------------------------------------------------------
    //
    //
    // --------------------------------------------------------------------------
    function initShader( src, type ) {
      var shader = gl.createShader( type );

      gl.shaderSource( shader, src );

      // Compile and check status
      gl.compileShader( shader );
      var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled)
      {
        // Something went wrong during compilation; get the error
        var lastError = gl.getShaderInfoLog(shader);
        console.error( "Error compiling shader '" + shader + "':" + lastError );
        gl.deleteShader( shader );

        return null;
      }

      return shader;
    }

    // --------------------------------------------------------------------------
    //
    //
    // --------------------------------------------------------------------------
    function createShaderProgram( shaders ) {
      var program = gl.createProgram();

      for(var i = 0; i < shaders.length; i+=1) {
        gl.attachShader( program, shaders[ i ] );
      }

      gl.linkProgram( program );

      // Check the link status
      var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!linked) {
        // something went wrong with the link
        var lastError = gl.getProgramInfoLog (program);
        console.error("Error in program linking:" + lastError);
        gl.deleteProgram(program);

        return null;
      }

      program.shaders = shaders;
      gl.useProgram(program);

      return program;
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function loadShaderFiles(vertexUrl, fragmentUrl) {

      function loadFile(url) {
        var xhr = new XMLHttpRequest();
        var okStatus = document.location.protocol === "file:" ? 0 : 200;
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.status === okStatus ? xhr.responseText : null;
      }

      var vertexShader = initShader(loadFile(vertexUrl), gl.VERTEX_SHADER);
      var fragmentShader = initShader(loadFile(fragmentUrl), gl.FRAGMENT_SHADER);

      return [ vertexShader, fragmentShader ];
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function initAttribBuffers() {
      // Create buffer for vertex texture coordinates
      texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0]), gl.STATIC_DRAW);

      // Create a buffer for the vertex positions
      posCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posCoordBuffer);
      var x1 = -1;
      var x2 = 1;
      var y1 = -1;
      var y2 = 1;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2]), gl.STATIC_DRAW);
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function initFrameBuffer() {
          // Create and bind a framebuffer
          var fbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          fbo.width = imgw;
          fbo.height = imgh;

          // Need a texture we can bind after rendering to the fbo
          var rTex = gl.createTexture();

          gl.bindTexture(gl.TEXTURE_2D, rTex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          // Calling with null image data means we intend to render to this texture
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height,
                        0, gl.RGBA, gl.UNSIGNED_BYTE, null);

          // Attach the color buffer to fbo
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                  gl.TEXTURE_2D, rTex, 0);

          // Check fbo status
          var fbs = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
          if (fbs !== gl.FRAMEBUFFER_COMPLETE) {
            console.log("ERROR: There is a problem with the framebuffer: " + fbs);
          }

          // Clear the bindings we created in this function.
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);

          return [fbo, rTex];
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function createTextures() {
      // Create a texture.
      texture = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Also create some texture for passing in lighting values
      for (var i = 0; i < lightingTextureNames.length; i+=1) {
        lightingTextures[lightingTextureNames[i]] = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, lightingTextures[lightingTextureNames[i]]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      }

      gl.bindTexture(gl.TEXTURE_2D, null);
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function drawDisplayPass(xscale, yscale) {
      // Draw to the screen framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // Using the display shader program
      gl.useProgram(displayProgram);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, viewportWidth, viewportHeight);

      // Set up the sampler uniform and bind the rendered texture
      var u_image = gl.getUniformLocation(displayProgram, "u_image");
      gl.uniform1i(u_image, 0);
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, renderTexture);

      // Send over the model-view-projection matrix for display pass
      // left, right, bottom, top, near, far
      projection = mat4.ortho(projection, -xscale, xscale, -yscale, yscale, 1.0, -1.0);
      var mvpLoc = gl.getUniformLocation(displayProgram, "mvp");
      gl.uniformMatrix4fv(mvpLoc, false, projection);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.finish();
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function drawCompositePass(textureCanvas) {
      // Draw to the fbo on this pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      // Using the compositing shader program
      gl.useProgram(compositeProgram);

      //gl.clear(gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, imgw, imgh);

      // Set up the layer texture
      var layer = gl.getUniformLocation(compositeProgram, "layerSampler");
      gl.uniform1i(layer, 0);
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);

      // Set up the sampler uniform and bind the rendered texture
      var composite = gl.getUniformLocation(compositeProgram, "compositeSampler");
      gl.uniform1i(composite, 1);
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, renderTexture);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.finish();
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function drawLitCompositePass(viewDir, nxCanvas, nyCanvas, nzCanvas, scalarCanvas) {
      // Draw to the fbo on this pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

      // Using the lighting compositing shader program
      gl.useProgram(compositeLightProgram);

      gl.viewport(0, 0, imgw, imgh);

      var viewDirection = vec4.fromValues(viewDir[0], viewDir[1], viewDir[2], 0.0);
      var vdir = gl.getUniformLocation(compositeLightProgram, "viewDir");
      gl.uniform4fv(vdir, viewDirection);

      // Set up the scalar texture
      var scalar = gl.getUniformLocation(compositeLightProgram, "scalarSampler");
      gl.uniform1i(scalar, 0);
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, lightingTextures['scalars']);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, scalarCanvas);

      // Set up the normals (x component) texture
      var nx = gl.getUniformLocation(compositeLightProgram, "nxSampler");
      gl.uniform1i(nx, 1);
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, lightingTextures['nx']);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, nxCanvas);

      // Set up the normals (y component) texture
      var ny = gl.getUniformLocation(compositeLightProgram, "nySampler");
      gl.uniform1i(ny, 2);
      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, lightingTextures['ny']);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, nyCanvas);

      // Set up the normals (z component) texture
      var nz = gl.getUniformLocation(compositeLightProgram, "nzSampler");
      gl.uniform1i(nz, 3);
      gl.activeTexture(gl.TEXTURE0 + 3);
      gl.bindTexture(gl.TEXTURE_2D, lightingTextures['nz']);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, nzCanvas);

      // Set up the sampler uniform and bind the rendered texture
      var composite = gl.getUniformLocation(compositeLightProgram, "compositeSampler");
      gl.uniform1i(composite, 4);
      gl.activeTexture(gl.TEXTURE0 + 4);
      gl.bindTexture(gl.TEXTURE_2D, renderTexture);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.finish();
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function clearFbo() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }


    return {
      'init': init,
      'clearFbo': clearFbo,
      'drawCompositePass': drawCompositePass,
      'drawLitCompositePass': drawLitCompositePass,
      'drawDisplayPass': drawDisplayPass
    };

  };
}) ();
