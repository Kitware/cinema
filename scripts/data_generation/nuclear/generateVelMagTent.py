
###
### Run this script with pvpython so python can find paraview imports.
###

# -----------------------------------------------------------------------------
# ParaView Python - Path setup
# -----------------------------------------------------------------------------

import sys, os, argparse

from paraview.simple import *
from paraview import data_exploration as wx

#import matplotlib.pyplot as plt


###############################################################################
# Helper function to generate the tent functions needed for scalar opacity
# function
###############################################################################
def createHatFunctions():
    baseWidth = 0.25
    spacing = baseWidth / 2.0

    halfWidth = baseWidth / 2.0
    numberCenters = 1.0 / baseWidth
    centers = [ (baseWidth / 2.0) + (i * baseWidth) for i in range(int(numberCenters)) ]

    hatFunctions = []

    for c in centers:
        startPoint = c - halfWidth

        xPoints = [ 0.0, startPoint, startPoint + spacing, startPoint + (2 * spacing), 1.0 ]
        yPoints = [ 0.0, 0.0,        1.0,                  0.0,                        0.0 ]

        hatFunctions.append([xPoints, yPoints])

        #plt.plot(xPoints, yPoints, marker='o')

    #plt.show()
    return hatFunctions



###############################################################################
# This method does all the processing
###############################################################################
def doProcessing(inputDir, outputDir, sizeOption):

    resolution = 500

    view = GetRenderView()
    view.ViewSize = [ resolution, resolution ]
    view.Background = [1.0, 1.0, 1.0]
    view.OrientationAxesVisibility = 0
    view.CenterAxesVisibility = 0

    fins_states = ['on', 'off']
    tube_states = ['on', 'off']
    vol_states = ['on', 'off']

    #angle_steps = [15, 15]
    angle_steps = [90, 90]

    centerOfRotation = {
        'shortFat': [0.03210659957176176, 0.03210659957176176, 2.08050000667572],
        'longFat': [0.1284263964244019, 0.1284263964244019, 2.2200000286102295],
        'longSkinny': [0.0064213199143523525, 0.0064213199143523525, 2.097312331199646]
    }

    rotation_axis = [0.0, 0.0, 1.0]

    distance = {
        'shortFat': 0.25,
        'longFat': 1.16,
        'longSkinny': 0.27
    }

    transformDims = {
        'shortFat': [5, 5, 1],
        'longFat': [20, 20, 1],
        'longSkinny': [1, 1, 1]
    }

    # -----------------------------------------------------------------------------
    # Input data definition
    # -----------------------------------------------------------------------------

    rodPaths = {
        'shortFat': 'rodShortest.vtk',
        'longFat': 'rodLong.vtk',
        'longSkinny': 'rodShorter.vtk'
    }

    rodPath = os.path.join(inputDir, rodPaths[sizeOption])
    blockFinsPath = os.path.join(inputDir, 'firstBlockFin.vtk')

    filePattern = {
        'shortFat': 'singlepin_shortest_%d.vtk',
        'longFat': 'singlepin_%d.vtk',
        'longSkinny': 'singlepin_clipped_%d.vtk'
    }

    #fileTimes = range(13) # all timesteps
    fileTimes = [ 7 ]

    fileNames = [ os.path.join(inputDir, (filePattern[sizeOption] % time)) for time in fileTimes ]


    # -------------------------------------------------------------------------
    # Pipeline definition
    # -------------------------------------------------------------------------

    # Rod Core
    rodCore = LegacyVTKReader(FileNames=[rodPath])

    # create a new 'Transform'
    rodTransform = Transform(Input=rodCore)
    rodTransform.Transform = 'Transform'
    rodTransform.Transform.Scale = transformDims[sizeOption]

    rodRep = Show(rodTransform)

    # Block Fins
    blockFins = LegacyVTKReader(FileNames=[blockFinsPath])

    # create a new 'Transform'
    blockTransform = Transform(Input=blockFins)
    blockTransform.Transform = 'Transform'
    blockTransform.Transform.Scale = transformDims[sizeOption]

    finsRep = Show(blockTransform)

    # Data pipeline
    reader = LegacyVTKReader(FileNames=fileNames)

    # create a new 'Transform'
    readerTransform = Transform(Input=reader)
    readerTransform.Transform = 'Transform'
    readerTransform.Transform.Scale = transformDims[sizeOption]

    dataRep = Show(readerTransform)


    velLUT = GetColorTransferFunction('vel')
    velLUT.RGBPoints = [0.0, 0.368627, 0.309804, 0.635294, 0.6000048000384004, 0.196078, 0.533333, 0.741176, 1.2000096000768008, 0.4, 0.760784, 0.647059, 1.800014400115201, 0.670588, 0.866667, 0.643137, 2.4000192001536016, 0.901961, 0.960784, 0.596078, 3.0000240001920018, 1.0, 1.0, 0.74902, 3.600028800230402, 0.996078, 0.878431, 0.545098, 4.200033600268802, 0.992157, 0.682353, 0.380392, 4.800038400307203, 0.956863, 0.427451, 0.262745, 5.400043200345603, 0.835294, 0.243137, 0.309804, 6.0, 0.619608, 0.00392157, 0.258824]
    velLUT.LockScalarRange = 1
    velLUT.ColorSpace = 'RGB'
    velLUT.NanColor = [0.500008, 0.0, 0.0]
    velLUT.ScalarRangeInitialized = 1.0

    # get opacity transfer function/opacity map for 'vel'
    #velPWF = GetOpacityTransferFunction('vel')
    #velPWF.Points = [0.0, 0.0, 0.5, 0.0, 4.471337795257568, 0.0, 0.5, 0.0, 5.1019110679626465, 1.0, 0.5, 0.0, 5.866241931915283, 0.0, 0.5, 0.0, 6.0, 0.0, 0.5, 0.0]
    #velPWF.ScalarRangeInitialized = 1

    dataRep.Representation = 'Volume'
    dataRep.ColorArrayName = ['POINTS', 'vel']
    dataRep.LookupTable = velLUT
    #dataRep.ScalarOpacityFunction = velPWF
    dataRep.ScalarOpacityUnitDistance = 0.0016956502318768525


    rodRep.ColorArrayName = [None, '']
    rodRep.DiffuseColor = [0.3333333333333333, 0.0, 0.0]
    rodRep.ScalarOpacityUnitDistance = 0.0043231046585508965

    finsRep.ColorArrayName = [None, '']
    finsRep.DiffuseColor = [0.6666666666666666, 0.3333333333333333, 0.0]
    finsRep.ScalarOpacityUnitDistance = 0.004452134850700366

    print "Going to set the distance to ",distance[sizeOption]

    fng = wx.FileNameGenerator(outputDir, '{time}/{fins}/{tube}/{volumeIdx}/{theta}_{phi}.jpg')
    exporter = wx.ThreeSixtyImageStackExporter(fng,
                                               view,
                                               centerOfRotation[sizeOption],
                                               distance[sizeOption],
                                               rotation_axis,
                                               angle_steps)


    hatFunctions = createHatFunctions()

    Render()

    for t in fileTimes:
        time = int(t)
        GetAnimationScene().TimeKeeper.Time = float(time)
        UpdatePipeline(time)

        dataRange = [0.0, 6.0]
        print "Moving to timestep ",time,", new data range: ",dataRange

        for finState in fins_states:
            if finState == 'on':
                finsRep.Visibility = 1
            else:
                finsRep.Visibility = 0

            fng.update_active_arguments(fins=finState)
            fng.update_label_arguments(fins="Fins")

            for tubeState in tube_states:
                if tubeState == 'on':
                    rodRep.Visibility = 1
                else:
                    rodRep.Visibility = 0
                fng.update_active_arguments(tube=tubeState)
                fng.update_label_arguments(tube="Tube")

                for volumeIdx in range(4):
                    curRange = dataRange[1] - dataRange[0]
                    xPoints = hatFunctions[volumeIdx][0]
                    yPoints = hatFunctions[volumeIdx][1]
                    pwfPoints = []

                    for i in range(len(xPoints)):
                        pwfPoints.append(dataRange[0] + (xPoints[i] * curRange))
                        pwfPoints.append(yPoints[i])
                        pwfPoints.append(0.5)
                        pwfPoints.append(0.0)

                    newPwf = CreatePiecewiseFunction(Points=pwfPoints)
                    dataRep.ScalarOpacityFunction = newPwf

                    fng.update_active_arguments(volumeIdx=volumeIdx)
                    fng.update_label_arguments(volumeIdx="Idx")
                    exporter.UpdatePipeline(time)


###############################################################################
# Main script entry point
###############################################################################
if __name__ == "__main__":
    description = "Python script to generate volume rendered (tent) cinema dataset for DOE NE"

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("--inputdir", type=str, default="", help="Path to directory where input data files exist")
    parser.add_argument("--outputdir", type=str, default="", help="Path to directory where cinema dataset should be written")
    parser.add_argument("--sizeopt", type=str, default="", help="One of 'shortFat', 'longFat', or 'longSkinny'")

    args = parser.parse_args()

    doProcessing(args.inputdir, args.outputdir, args.sizeopt)
