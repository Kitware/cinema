(function () {

    cinema.utilities.Base64LookupTable = function() {

        /**
         * A simple mapping from integers/ordinals to their base64 counterpart
         * and vice-versa.
         */
        var lookupTable = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
                            "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f",
                            "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v",
                            "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/" ],
            reverseTable = [];

        function o2b(ordinal) {
            return lookupTable[ordinal];
        }

        function b2o(base64Value) {
            return reverseTable[base64Value];
        }

        for (var idx = 0; idx < lookupTable.length; idx += 1) {
            reverseTable[lookupTable[idx]] = idx;
        }

        return {
            'o2b': o2b,
            'b2o': b2o
        };
    };
}());
