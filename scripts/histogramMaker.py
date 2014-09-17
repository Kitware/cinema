
import re, json, argparse, os, math, itertools, time


# =============================================================================
# Convenience function that takes an order string, as would be found in the
# query.json files (e.g. "ACDIEJF+"), along with a list of layer codes
# (e.g. ['A', 'I', 'J']) and returns the layer code from that list which is
# on top (nearest the beginning) of the order string, disregarding all other
# layer codes.  If no layer from the layer list is present in the order string.
#
# For example, if called with:
#
#     ("ACDIEJF+", [ 'D', 'J' ])
#
# Then this function would return:
#
#     'D'
#
# =============================================================================
def findTopLayer(orderString, layerlist):
    for ch in orderString:
        if ch in layerlist:
            return ch
    return None


# =============================================================================
# Convenience function to return a list of lists containing all possible
# subsets of the given layerlist.
#
# =============================================================================
def findAllCombinations(layers):
    layerlist = [ ch for ch in layers ]
    resultList = []
    size = len(layerlist)
    while size > 0:
        combos = itertools.combinations(layerlist, size)
        for combo in combos:
            comboStrings = [ s.encode('utf8') for s in combo ]
            resultList.append(comboStrings)
        size -= 1
    return resultList


# =============================================================================
# Takes a query.json object and calculates the percent pixel coverage for each
# of the layers (layers are represented by single-letter layer codes) in the
# layerlist parameter.  For example, if the layerlist contained:
#
#     [ 'A', 'B', 'C', 'D', 'E' ]
#
# Then this function would return a json object similar to the following:
#
#     {'A': 61.2552, 'C': 2.904, 'B': 2.6728, 'E': 3.0228, 'D': 3.1232}
#
# =============================================================================
def processQueryFile(queryJsonObj, layerlist):
    layerMap = {}
    for layer in layerlist:
        layerMap[layer] = 0

    numPixels = 0

    dimensions = queryJsonObj['dimensions']
    counts = queryJsonObj['counts']
    numPixels = int(dimensions[0]) * int(dimensions[1])

    # Iterate over the 'counts' dictionary, which has a structure like this:
    #
    #     "counts": { "+" : 61110, "A+" : 7807, "AB+" : 131, ... }
    #
    for count in counts:
        topLayer = findTopLayer(count, layerlist)
        if topLayer:
            layerMap[topLayer] += counts[count]

    # Convert counts to percentages
    for layer in layerMap:
        layerMap[layer] = 100 * float(layerMap[layer]) / numPixels

    return layerMap


# =============================================================================
# Given a name pattern like "{time}/{theta}/{phi}/{filename}" (or similar) and
# a dictionary of values where the top-level keys in the dictionary should
# correspond to the strings within the '{' and '}' in the name pattern,
# generate tuples of the form (index, relative path).
# =============================================================================
def cinemaFileIterator(namePattern, dictList):
    regex = re.compile('{(.+)}')
    compList = namePattern.split('/')
    argumentList = []

    for comp in compList[:-1]:
        m = regex.search(comp)
        argumentList.append(dictList[m.group(1)]['values'])

    maxIndices = [ len(argumentList[i]) - 1 for i in xrange(len(argumentList)) ]
    currentIndices = [ 0 for i in argumentList ]

    done = False
    idx = 0

    while not done:
        currentValues = [ argumentList[i][currentIndices[i]] for i in xrange(len(currentIndices)) ]
        relPath = os.path.join(*currentValues)
        yield idx, relPath
        # try to increment our multi-base "counter" (the index list), and if
        # We have reached the top, then we break
        idx += 1
        for i in xrange(len(currentIndices) - 1, -1, -1):
            if currentIndices[i] < maxIndices[i]:
                currentIndices[i] += 1
                break
            else:
                if i == 0:
                    done = True
                currentIndices[i] = 0


# =============================================================================
# The parameter workdir should be a path to a folder with an info.json file in
# it, which should describe the directory structure below that in terms of
# timestep, theta, and phi subdirectories below that.  Then this function
# iterates over that entire directory structure, processing all the query.json
# files.
#
# The result will be a directory hierarchy of histogram files, each specific to
# a particular combination of layers from the set of layers available in the
# dataset.  These histograms can be used to generate chart visualizations like
# the one ParaView Cinema shows for pixel coverages.
#
# =============================================================================
def processDataSet(workdir, outputDir):

    # First open the top-level info.json file which describes the whole dataset
    jsonObj = None
    filename = os.path.join(workdir, 'info.json')
    with open(filename, 'r') as fd:
        jsonObj = json.load(fd)

    # Pull out all layer names, the name_pattern, and all "arguments"
    layers = jsonObj['metadata']['layers']
    namePattern = jsonObj['name_pattern']
    arguments = jsonObj['arguments']

    # Generate all possible combinations of layers in the dataset
    allCombinations = findAllCombinations(layers)

    print 'Reading query.json files into memory...'

    # Generate the dictionary of files we need to process for every possible
    # combination of layers.  The keys are unique ids given by a linear indexing
    # of the values in time, theta, and phi (or whatever is in name_pattern).
    queryJsonObjects = {}
    for fileIdx, relativePath in cinemaFileIterator(namePattern, arguments):
        #print 'id: ',fileIdx,', path: ',relativePath
        queryJsonFile = os.path.join(workdir, relativePath, 'query.json')
        with open(queryJsonFile, 'r') as fd:
            queryJsonObjects[fileIdx] = json.load(fd)

    combosToProcess = len(allCombinations)
    currentCombo = 1

    # Iterate over every possible combination of layers available in the dataset
    for layerlist in allCombinations:
        startTime = int(math.ceil(time.time()))
        print 'Processing ',currentCombo,' of ',combosToProcess,' layer combinations'

        # Create an empty histogram list
        histogram = [{ "values": {layer: 0 for layer in layerlist},
                       "images": {layer: [] for layer in layerlist} } for i in range(100)]

        # Now process every query.json file/object in the entire data set
        for queryJsonKey in queryJsonObjects:
            queryJson = queryJsonObjects[queryJsonKey]
            percentCoverages = processQueryFile(queryJson, layerlist)
            for l in percentCoverages:
                binNumber = int(math.floor(percentCoverages[l]))
                histogram[binNumber]['values'][l] += 1
                histogram[binNumber]['images'][l].append(queryJsonKey)

        # We have already assumed fixed bin sizes of 1 percent, from 0.0 to 100.0,
        # but to support future applications where different bin sizes are used, we
        # add in the ranges for each bin.
        binMin = 0.0;
        for bin in histogram:
            bin['xMin'] = binMin
            bin['xMax'] = binMin + 1.0
            binMin += 1.0

            # While we're at it, let's remove the key/val pairs from "images"
            # where the value (a list) is empty
            empties = []
            for key in bin['images']:
                if len(bin['images'][key]) == 0:
                    empties.append(key)

            for key in empties:
                bin['images'].pop(key, None)

        # Now write out the histogram
        outputFilePath = os.path.join(outputDir, *layerlist)
        if not os.path.exists(outputFilePath):
            os.makedirs(outputFilePath)
        histogramFile = os.path.join(outputFilePath, 'histogram.json')
        with open(histogramFile, 'w') as fd:
            json.dump(histogram, fd)

        # It's nice to see some progress while the job is running
        elapsedTime = int(math.ceil(time.time())) - startTime
        print '    Finished in ',elapsedTime,' seconds, wrote file: ',histogramFile

        currentCombo += 1


# =============================================================================
# Main script entry point.
#
# The purpose of the script is to go through a Cinema dataset, iterating over
# the image directories associated with time, theta, and phi, and generate (for
# all possible combinations of layers available in the data set) a directory
# structure of "histogram" files containing json objects.  The structure of a
# histogram.json file for a given combination of layers will look like the
# following:
#
#     [
#         ...,
#         {
#             "xMin": 32.0,
#             "values": { "A": 22, "C": 0, "G": 0, "F": 0, "I": 0, "K": 0, "J": 0 },
#             "images": {
#                 "A": ["0/10/90", ...]
#             },
#             "xMax": 33.0
#         },...
#     ]
#
# =============================================================================
if __name__ == "__main__":
    description = "Python script to generate a ParaView Cinema Pixel Coverage Histogram"

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("-w", "--working-dir", default=os.getcwd(), dest="workDir",
                        help="Directory containing info.json and timestep directories")
    parser.add_argument("-o", "--output-dir", default=os.getcwd(), dest="outputDir",
                        help="Directory where histogram files should be written")

    args = parser.parse_args()

    processDataSet(args.workDir, args.outputDir)
