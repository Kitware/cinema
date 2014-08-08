/**
 * Compute the required composite data.
 */
cinema.utilities.computeCompositeData = function (info, orderMapping) {
    var composite = info.json['pixel-order'].split('+'),
        count = composite.length;

    while (count--) {
        var str = composite[count];
        if(str[0] === '@') {
            composite[count] = Number(str.substr(1));
        }
        else if (!orderMapping.hasOwnProperty(str)) {
            orderMapping[str] = computeOffset(str);
        }
    }

    info.composite = composite;
};
