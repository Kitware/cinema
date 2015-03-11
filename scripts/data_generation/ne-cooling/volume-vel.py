
###
### This script can be run with pvpython rather than pvbatch, as it does not
### need mpi.
###
### Purpose:
###
###     Generate a static image dataset of volume rendering on the ne cooling data
###
### Example usages (assumes you are in directory with this script):
###
###        1) To run on the coarse mesh with tent-shaped opacity functions
###
###    /home/scott/projects/ParaView/build/bin/pvpython volume-vel.py --inputdir "/media/scott/CINEMA FAT/ne-water-cool/coarse" --inputpattern "101results_%d.vtk" --outputdir "/media/scott/CINEMA FAT/ne-water-cool/coarse/Output/vel/tent" --optype "tent"
###
###        2) To run on the coarse mesh with linear opacity functions
###
###    /home/scott/projects/ParaView/build/bin/pvpython volume-vel.py --inputdir "/media/scott/CINEMA FAT/ne-water-cool/coarse" --inputpattern "101results_%d.vtk" --outputdir "/media/scott/CINEMA FAT/ne-water-cool/coarse/Output/vel/linear" --optype "linear"
###
###        3) To run on the fine mesh with tent-shaped opacity functions
###
###    /home/scott/projects/ParaView/build/bin/pvpython volume-vel.py --inputdir "/media/scott/CINEMA FAT/ne-water-cool/fine" --inputpattern "fine_results_%d.vtk" --outputdir "/media/scott/CINEMA FAT/ne-water-cool/fine/Output/vel/tent" --optype "tent"
###
###        4) To run on the fine mesh with linear opacity functions
###
###    /home/scott/projects/ParaView/build/bin/pvpython volume-vel.py --inputdir "/media/scott/CINEMA FAT/ne-water-cool/fine" --inputpattern "fine_results_%d.vtk" --outputdir "/media/scott/CINEMA FAT/ne-water-cool/fine/Output/vel/linear" --optype "linear"
###

import sys, os, argparse


from paraview.simple import *
from paraview import data_exploration as wx

#import matplotlib.pyplot as plt

###############################################################################
# Helper function to generate the tent functions needed for scalar opacity
# function
###############################################################################
def createHatFunctions():
    baseWidth = 0.20
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
def doProcessing(inputDir, inputPattern, outputDir, opacityFnType):

    # -----------------------------------------------------------------------------
    # Path to input/output data/directories
    # -----------------------------------------------------------------------------
    files_pattern = os.path.join(inputDir, inputPattern)

    file_times = range(0, 101)
    #file_times = [ 80 ]
    filenames = [ (files_pattern % time) for time in file_times]

    # -----------------------------------------------------------------------------
    # Rendering configuration
    # -----------------------------------------------------------------------------

    resolution = 500
    view_size = [resolution, resolution]
    angle_steps = [15, 15]
    #angle_steps = [90, 90]
    distance = 24632.991324377483
    rotation_axis = [0.0, 1.0, 0.0]
    #center_of_rotation = [-1649.1046142578125, -752.328125, 1374.1217346191406]
    center_of_rotation = [0.0, 0.0, 0.0]

    view = GetRenderView()
    view.ViewSize = view_size
    view.Background = [0.0, 0.0, 0.0]
    view.OrientationAxesVisibility = 0
    view.CenterAxesVisibility = 0

    # -----------------------------------------------------------------------------
    # Output configuration
    # -----------------------------------------------------------------------------
    fng = wx.FileNameGenerator(outputDir, '{time}/{volumeIdx}/{theta}_{phi}.jpg')
    exporter = wx.ThreeSixtyImageStackExporter(fng,
                                               view,
                                               center_of_rotation,
                                               distance,
                                               rotation_axis,
                                               angle_steps)

    # -----------------------------------------------------------------------------
    # Pipeline configuration
    # -----------------------------------------------------------------------------

    # create a new 'Legacy VTK Reader'
    readerProxy = LegacyVTKReader(FileNames=filenames)

    # This translation transform is a workaround for a bug in the camera orbiting
    # calculations made in ThreeSixtyImageStackExporter
    transform1 = Transform(Input=readerProxy)
    transform1.Transform = 'Transform'
    transform1.Transform.Translate = [1649.1046142578125, 752.328125, -1374.1217346191406]

    # create a new 'Cell Data to Point Data'
    cellDatatoPointData1 = CellDatatoPointData(Input=transform1)

    # get color transfer function/color map for 'vel'
    velLUT = GetColorTransferFunction('vel')
    velLUT.RGBPoints = [0.0, 0.0, 0.0, 1.0, 15000.0, 1.0, 0.0, 0.0]
    velLUT.LockScalarRange = 1
    velLUT.ColorSpace = 'HSV'
    velLUT.NanColor = [0.498039, 0.498039, 0.498039]
    velLUT.ScalarRangeInitialized = 1.0

    # get opacity transfer function/opacity map for 'vel'
    velPWF = GetOpacityTransferFunction('vel')
    velPWF.Points = [0.0, 0.0, 0.5, 0.0, 15000.0, 1.0, 0.5, 0.0]
    velPWF.ScalarRangeInitialized = 1

    # show data from fine_results_
    readerDisplay = Show(transform1)
    readerDisplay.ColorArrayName = [None, '']
    readerDisplay.Opacity = 0.15
    readerDisplay.ScalarOpacityUnitDistance = 79.03822718592288

    # show data from cellDatatoPointData1
    cellDatatoPointData1Display = Show(cellDatatoPointData1)
    cellDatatoPointData1Display.Representation = 'Volume'
    cellDatatoPointData1Display.ColorArrayName = ['POINTS', 'vel']
    cellDatatoPointData1Display.LookupTable = velLUT
    cellDatatoPointData1Display.ScalarOpacityFunction = velPWF
    cellDatatoPointData1Display.ScalarOpacityUnitDistance = 79.03822718592288

    # -----------------------------------------------------------------------------
    # Batch processing
    # -----------------------------------------------------------------------------

    if opacityFnType == 'tent':
        hatFunctions = createHatFunctions()

    Render()

    for t in range(0, len(file_times), 1):
        time = file_times[t]
        GetAnimationScene().TimeKeeper.Time = float(time)
        UpdatePipeline(time)
        dataRange = [0.0, 15000.0]
        print "Moving to timestep ",time,", new data range: ",dataRange
        for volumeIdx in range(5):
            curRange = dataRange[1] - dataRange[0]
            pwfPoints = []

            if opacityFnType == 'tent':
                xPoints = hatFunctions[volumeIdx][0]
                yPoints = hatFunctions[volumeIdx][1]
                for i in range(len(xPoints)):
                    pwfPoints.append(dataRange[0] + (xPoints[i] * curRange))
                    pwfPoints.append(yPoints[i])
                    pwfPoints.append(0.5)
                    pwfPoints.append(0.0)
            else:
                curStep = dataRange[0] + (float(volumeIdx) * (curRange / 5.0))
                pwfPoints = [ dataRange[0], 0.0, 0.5, 0.0,
                              curStep,      0.0, 0.5, 0.0,
                              dataRange[1], 1.0, 0.5, 0.0 ]

            newPwf = CreatePiecewiseFunction( Points=pwfPoints )
            cellDatatoPointData1Display.ScalarOpacityFunction = newPwf
            fng.update_active_arguments(volumeIdx=volumeIdx)
            fng.update_label_arguments(volumeIdx="Idx")
            exporter.UpdatePipeline(time)

###############################################################################
# Main script entry point
###############################################################################
if __name__ == "__main__":
    description = "Python script to generate volume rendered NE cooling data"

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("--inputdir", type=str, default="", help="Path to directory where input data files exist")
    parser.add_argument("--inputpattern", type=str, default="", help="String pattern containing %d where pattern should be replaced with numbers")
    parser.add_argument("--outputdir", type=str, default="", help="Path to directory where cinema dataset should be written")
    parser.add_argument("--optype", type=str, default="", help="Opacity function type, should be either 'tent' or 'linear'")

    args = parser.parse_args()

    doProcessing(args.inputdir, args.inputpattern, args.outputdir, args.optype)
