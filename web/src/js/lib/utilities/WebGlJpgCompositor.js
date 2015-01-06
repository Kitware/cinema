
(function () {

  cinema.utilities.CreateWebGlJpgCompositor = function() {

    var gl = 0,
    displayProgram = null,
    compositeProgram = null,
    texCoordBuffer = 0,
    posCoordBuffer = 0,
    texture = 0,
    depthTexture = 0,
    fb1 = 0,
    fb2 = 0,
    rt1 = 0,
    rt2 = 0,
    pong = false,
    fbo = 0,
    renderTexture = 0,
    numSprites = 22,
    imgw = 500,
    imgh = 500,
    viewportWidth = 0,
    viewportHeight = 0,
    vpCenterX = 0,
    vpCenterY = 0,
    left = 0,
    right = 0,
    bottom = 0,
    top = 0,
    projection = null,
    mvp = null,
    glCanvas = null,
    copyCanvas = null,
    depthCanvas = null,
    programReqs = {
      'display' : {
        'vertex': cinema.staticRoot + 'shaders/vertex/displayVertex.c',
        'fragment': cinema.staticRoot + 'shaders/fragment/displayFragment.c',
        'loaded': false
      },
      'composite': {
        'vertex': cinema.staticRoot + 'shaders/vertex/compositeVertex.c',
        'fragment': cinema.staticRoot + 'shaders/fragment/compositeJpgFragment.c',
        'loaded': false
      }
    },
    programsLoaded = false,
    initialized = false;


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function init(imgSize, webglCanvas, copyBufferCanvas, depthBufferCanvas) {
      if (initialized === true) {
        cleanUpGlState();
      }

      initialized = true;

      imgw = imgSize[0];
      imgh = imgSize[1];
      viewportWidth = webglCanvas.width;
      viewportHeight = webglCanvas.height;
      vpCenterX = viewportWidth / 2.0;
      vpCenterY = viewportHeight / 2.0;
      glCanvas = webglCanvas;
      copyCanvas = copyBufferCanvas;
      depthCanvas = depthBufferCanvas;

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

      // Load shaders for display program
      loadShaderFiles(programReqs.display.vertex, programReqs.display.fragment, function (shaders) {
        displayProgram = createShaderProgram(shaders);

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

        programReqs.display.loaded = true;
      });

      // Load shaders for composite program
      loadShaderFiles(programReqs.composite.vertex, programReqs.composite.fragment, function (shaders) {
        compositeProgram = createShaderProgram(shaders);

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

        programReqs.composite.loaded = true;
      });

      // Create two framebuffers for repeated rendering to texture
      var pingFbo = initFrameBuffer();
      fb1 = pingFbo[0];
      rt1 = pingFbo[1];

      var pongFbo = initFrameBuffer();
      fb2 = pongFbo[0];
      rt2 = pongFbo[1];

      pong = true;
      fbo = fb1;
      renderTexture = rt2;
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function resizeViewport(newWidth, newHeight) {
      viewportWidth = newWidth;
      viewportHeight = newHeight;
      vpCenterX = viewportWidth / 2.0;
      vpCenterY = viewportHeight / 2.0;
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

        // Now clean up fbo, textures, and buffers
        gl.deleteFramebuffer(fb1);
        gl.deleteTexture(rt1);
        gl.deleteFramebuffer(fb2);
        gl.deleteTexture(rt2);
        gl.deleteTexture(texture);
        gl.deleteTexture(depthTexture);
        gl.deleteBuffer(texCoordBuffer);
        gl.deleteBuffer(posCoordBuffer);

        // And finally, reset flags to indicate shaders not yet loaded
        for (var progReq in programReqs) {
          if (_.has(programReqs, progReq)) {
            programReqs[progReq].loaded = false;
          }
        }

        programsLoaded = false;
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function initGL() {
      // Get A WebGL context
      gl = glCanvas.getContext("experimental-webgl", {preserveDrawingBuffer:true}) || glCanvas.getContext("webgl", {preserveDrawingBuffer:true});
      if (!gl) {
        return null;
      }
      // Set clear color to white, fully transparent
      gl.clearColor(1.0, 1.0, 1.0, 0.0);

      var vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      var fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      var combinedUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

      //console.log("vertex texture image units: " + vertexUnits);
      //console.log("fragment texture image units: " + fragmentUnits);
      //console.log("combined texture image units: " + combinedUnits);
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
    function loadShaderFiles(vertexUrl, fragmentUrl, readyCallback) {

      var initializedShaders = {};

      function shaderLoaded(srcString, whichProgram) {
        initializedShaders[whichProgram] = initShader(srcString, whichProgram);
        if (_.has(initializedShaders, gl.VERTEX_SHADER) && _.has(initializedShaders, gl.FRAGMENT_SHADER)) {
          readyCallback([initializedShaders[gl.VERTEX_SHADER], initializedShaders[gl.FRAGMENT_SHADER]]);
        }
      }

      $.ajax({
        url: vertexUrl,
        dataType: 'text',
        success: function (result) {
          shaderLoaded(result, gl.VERTEX_SHADER);
        },
        error: function (xhr, status, error) {
          console.log("Unable to load vertex shader (" + vertexUrl + "): " + error);
        }
      });

      $.ajax({
        url: fragmentUrl,
        dataType: 'text',
        success: function (result) {
          shaderLoaded(result, gl.FRAGMENT_SHADER);
        },
        error: function (xhr, status, error) {
          console.log("Unable to load fragment shader (" + fragmentUrl + "): " + error);
        }
      });
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
    function swapFbos() {
      if (pong === true) {
        fbo = fb2;
        renderTexture = rt1;
        pong = false;
      } else {
        fbo = fb1;
        renderTexture = rt2;
        pong = true;
      }
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

      // Create another texture.
      depthTexture = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function calculateProjectionMatrix(matrix, xscale, yscale, center) {
      // Relate the center of the current viewport to the center of clip space
      var centerX = ((vpCenterX - center[0]) / vpCenterX) * xscale;
      var centerY = ((center[1] - vpCenterY) / vpCenterY) * yscale;

      left = centerX - xscale;
      right = centerX + xscale;
      bottom = centerY - yscale;
      top = centerY + yscale;

      mat4.ortho(matrix, left, right, bottom, top, 1.0, -1.0);
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function allProgramsReady() {
      if (programsLoaded === true) {
        return true;
      }

      for (var key in programReqs) {
        if (_.has(programReqs, key)) {
          if (programReqs[key].loaded === false) {
            return false;
          }
        }
      }

      programsLoaded = true;
      return true;
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function drawDisplayPass(xscale, yscale, center) {
      if (!allProgramsReady()) {
        return;
      }

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

      // Get a projection matrix to draw the final image at the correct scale and location
      calculateProjectionMatrix(projection, xscale, yscale, center);
      var mvpLoc = gl.getUniformLocation(displayProgram, "mvp");
      gl.uniformMatrix4fv(mvpLoc, false, projection);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.finish();
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function drawCompositePass() {
      if (!allProgramsReady()) {
        return;
      }

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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, copyCanvas);

      // Set up the depth texture
      var depth = gl.getUniformLocation(compositeProgram, "depthSampler");
      gl.uniform1i(depth, 1);
      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,  gl.RGBA, gl.UNSIGNED_BYTE, depthCanvas);

      // Set up the sampler uniform and bind the rendered texture
      var composite = gl.getUniformLocation(compositeProgram, "compositeSampler");
      gl.uniform1i(composite, 2);
      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, renderTexture);

      // Draw the rectangle.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.finish();

      // Ping-pong
      swapFbos();
    }


    // --------------------------------------------------------------------------
    //
    // --------------------------------------------------------------------------
    function clearFbo() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
      gl.clear(gl.COLOR_BUFFER_BIT);

      pong = true;
      fbo = fb1;
      renderTexture = rt2;
    }

    function getImage() {
      var image = new Image();
      image.src = glCanvas.toDataURL("image/png");
      return image;
    }

    return {
      'init': init,
      'clearFbo': clearFbo,
      'drawCompositePass': drawCompositePass,
      'drawDisplayPass': drawDisplayPass,
      'resizeViewport': resizeViewport,
      'getImage': getImage
    };

  };
}) ();
