
function CreateWebGlCompositor() {

  var gl = 0,
  displayProgram = null,
  compositeProgram = null,
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
  glCanvas = null,
  spriteCanvas = null,
  copyCanvas = null,
  initialized = false;


  // --------------------------------------------------------------------------
  //
  // --------------------------------------------------------------------------
  function init(imgSize, webglCanvas, spriteSheetCanvas, copyBufferCanvas) {
    if (initialized == true) {
      cleanUpGlState();
    }

    initialized = true;

    imgw = imgSize[0];
    imgh = imgSize[1];
    viewportWidth = webglCanvas.width;
    viewportHeight = webglCanvas.height;
    glCanvas = webglCanvas;
    spriteCanvas = spriteSheetCanvas;
    copyCanvas = copyBufferCanvas;

    //Inialize GL context
    initGL();

    // Create a texture object
    createTexture();

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

      // Now clean up fbo, textures, and buffers
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(renderTexture);
      gl.deleteTexture(texture);
      gl.deleteBuffer(texCoordBuffer);
      gl.deleteBuffer(posCoordBuffer);
  }


  // --------------------------------------------------------------------------
  //
  // --------------------------------------------------------------------------
  function initGL() {
    // Get A WebGL context
    // gl = glCanvas.getContext("experimental-webgl", {premultipliedAlpha: false, preserveDrawingBuffer: true}) || glcanvas.getContext("webgl",  {premultipliedAlpha: false, preserveDrawingBuffer: true});
    gl = glCanvas.getContext("experimental-webgl") || glcanvas.getContext("webgl");
    if (!gl) {
      return null;
    }
    // Set clear color to white, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    //gl.viewport(0, 0, imgw, imgh);
    //gl.clear(gl.COLOR_BUFFER_BIT);

    var vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    var fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    var combinedUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

    console.log("vertex texture image units: " + vertexUnits);
    console.log("fragment texture image units: " + fragmentUnits);
    console.log("combined texture image units: " + combinedUnits);
  };

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
  };

  // --------------------------------------------------------------------------
  //
  //
  // --------------------------------------------------------------------------
  function createShaderProgram( shaders ) {
    var program = gl.createProgram();

    for(var i = 0; i < shaders.length; ++i ) {
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
  };


  // --------------------------------------------------------------------------
  //
  // --------------------------------------------------------------------------
  function loadShaderFiles(vertexUrl, fragmentUrl) {

    function loadFile(url) {
      var xhr = new XMLHttpRequest();
      var okStatus = document.location.protocol === "file:" ? 0 : 200;
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.status == okStatus ? xhr.responseText : null;
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
        if (fbs != gl.FRAMEBUFFER_COMPLETE) {
          console.log("ERROR: There is a problem with the framebuffer: ");
          console.log(getFramebufferErrorString(fbs));
        }

        // Clear the bindings we created in this function.
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return [fbo, rTex];
  }


  // --------------------------------------------------------------------------
  //
  // --------------------------------------------------------------------------
  function createTexture() {
    // Create a texture.
    texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
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
  function drawDisplayPass() {
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
  function copySegmentOfSprite(imgIndex) {
    var destContext = copyCanvas.getContext('2d');

    var srcX = 0;
    var srcY = imgIndex * imgh;
    var widthToCopy = imgw;
    var heightToCopy = imgh;

    // Because the png has transparency, we need to clear the canvas, or else
    // we end up with some blending when we draw the next image
    destContext.clearRect(0, 0, widthToCopy, heightToCopy);

    destContext.drawImage(spriteCanvas,
                          srcX, srcY, widthToCopy, heightToCopy,
                          0, 0, widthToCopy, heightToCopy);

    drawCompositePass();
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
    'copySegmentOfSprite': copySegmentOfSprite,
    'drawCompositePass': drawCompositePass,
    'drawDisplayPass': drawDisplayPass
  };

}
