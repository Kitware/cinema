
precision mediump float;

uniform sampler2D compositeSampler;
uniform sampler2D layerSampler;
uniform sampler2D depthSampler;
varying vec2 v_texCoord;

void main() {
    // Sample the texture containing what we have composited so far
    vec4 color = texture2D(compositeSampler, v_texCoord);

    // Sample the new layer to be composited in
    vec4 compColor = texture2D(layerSampler, v_texCoord);
    vec4 depthColor = texture2D(depthSampler, v_texCoord);

    // Choose the fragment with the greater depth value
    if (color.a > depthColor.r) {
        gl_FragColor = color;
    } else {
        gl_FragColor = vec4(compColor.rgb, depthColor.r);
    }

/*
    // Another way to choose the fragment with the greater depth value
    float stepVal = step((depthColor.r - color.a), 0.0);
    vec3 c = (stepVal * color.rgb) + ((1.0 - stepVal) * compColor.rgb);
    gl_FragColor = (stepVal * color) + ((1.0 - stepVal) * compColor);
*/
}
