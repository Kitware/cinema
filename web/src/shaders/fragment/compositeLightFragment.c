
precision mediump float;

uniform sampler2D compositeSampler;
uniform sampler2D nxSampler;
uniform sampler2D nySampler;
uniform sampler2D nzSampler;
uniform sampler2D scalarSampler;

uniform vec4 viewDir;

varying vec2 v_texCoord;


float affine(float inMin, float val, float inMax, float outMin, float outMax) {
    return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}


float convert(vec4 c) {
    float r = affine(0.0, c.r, 1.0, 0.0, 255.0);
    float g = affine(0.0, c.g, 1.0, 0.0, 255.0);
    float b = affine(0.0, c.b, 1.0, 0.0, 255.0);
    float value = (r * 65536.0) + (g * 256.0) + b;
    return value / 16777216.0;
}


void main() {
    // Sample the texture containing what we have composited so far
    vec4 color = texture2D(compositeSampler, v_texCoord);

    // Sample the new layer to be composited in
    vec4 scalarColor = texture2D(scalarSampler, v_texCoord);
    vec4 nx = texture2D(nxSampler, v_texCoord);
    vec4 ny = texture2D(nySampler, v_texCoord);
    vec4 nz = texture2D(nzSampler, v_texCoord);

    vec4 lightColor = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 lightDir = normalize(vec4(1.0, 1.0, 1.0, 0.0));
    vec4 normal = vec4(convert(nx), convert(ny), convert(nz), 0.0);

    //var R = normal.multiply(2.0 * lightPosition.dot(normal)).subtract(lightPosition);
    vec4 R = (normal * 2.0 * dot(lightDir, normal)) - lightDir;

    float alpha = 5.0;
    float specularTerm = 0.2 * pow(dot(R, viewDir), alpha);
    vec4 specularColor = lightColor * specularTerm;

    // Choose the fragment with the greater depth value
    if (color.a > scalarColor.a) {
        gl_FragColor = color;
    } else {
        vec4 fColor = (scalarColor * 0.4) + (scalarColor * dot(lightDir, normal)) + specularColor;
        gl_FragColor = vec4(fColor.rgb, scalarColor.a);
    }
}
