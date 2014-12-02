
###
### Run this script with pvpython so python can find paraview imports.
###

# -----------------------------------------------------------------------------
# ParaView Python - Path setup
# -----------------------------------------------------------------------------

import sys, os, argparse

from paraview.simple import *
from paraview import data_exploration as wx


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

    fileTimes = range(13) # all timesteps
    #fileTimes = [ 12 ]

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


    helicityLUT = GetColorTransferFunction('helicity')
    helicityLUT.RGBPoints = [-10000.0, 0.368627, 0.309804, 0.635294, -7999.983999871999, 0.196078, 0.533333, 0.741176, -5999.967999743998, 0.4, 0.760784, 0.647059, -3999.951999615997, 0.670588, 0.866667, 0.643137, -1999.935999487995, 0.901961, 0.960784, 0.596078, 0.08000064000589191, 1.0, 1.0, 0.74902, 2000.096000768006, 0.996078, 0.878431, 0.545098, 4000.112000896008, 0.992157, 0.682353, 0.380392, 6000.12800102401, 0.956863, 0.427451, 0.262745, 8000.14400115201, 0.835294, 0.243137, 0.309804, 10000.0, 0.619608, 0.00392157, 0.258824]
    helicityLUT.LockScalarRange = 1
    helicityLUT.ColorSpace = 'RGB'
    helicityLUT.NanColor = [0.500008, 0.0, 0.0]
    helicityLUT.ScalarRangeInitialized = 1.0

    helicityPWF = GetOpacityTransferFunction('helicity')
    helicityPWF.Points = [-10000.0, 0.2, 0.5, 0.0, 0.0, 0.0, 0.5, 0.0, 10000.0, 0.2, 0.5, 0.0]
    helicityPWF.ScalarRangeInitialized = 1

    dataRep.Representation = 'Volume'
    dataRep.ColorArrayName = ['POINTS', 'helicity']
    dataRep.LookupTable = helicityLUT
    dataRep.ScalarOpacityFunction = helicityPWF
    dataRep.ScalarOpacityUnitDistance = 0.0010386458757740604

    rodRep.ColorArrayName = [None, '']
    rodRep.DiffuseColor = [0.3333333333333333, 0.0, 0.0]
    rodRep.ScalarOpacityUnitDistance = 0.0043231046585508965

    finsRep.ColorArrayName = [None, '']
    finsRep.DiffuseColor = [0.6666666666666666, 0.3333333333333333, 0.0]
    finsRep.ScalarOpacityUnitDistance = 0.004452134850700366

    print "Going to set the distance to ",distance[sizeOption]

    fng = wx.FileNameGenerator(outputDir, '{time}/{fins}/{tube}/{theta}_{phi}.jpg')
    exporter = wx.ThreeSixtyImageStackExporter(fng,
                                               view,
                                               centerOfRotation[sizeOption],
                                               distance[sizeOption],
                                               rotation_axis,
                                               angle_steps)

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
