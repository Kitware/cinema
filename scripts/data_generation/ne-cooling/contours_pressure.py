
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
###        1) To run on the coarse mesh
###
###    .../bin/pvpython contours_pressure.py --inputdir "/home/scott/Documents/ne-cooling/coarse" --inputpattern "101results_%d.vtk" --outputdir "/home/scott/Documents/ne-cooling/coarse/Output/pressure"
###

import sys, os, argparse


from paraview.simple import *
from paraview import data_exploration as wx

###############################################################################
# This method does all the processing
###############################################################################
def doProcessing(inputDir, inputPattern, outputDir):

    # -----------------------------------------------------------------------------
    # Path to input/output data/directories
    # -----------------------------------------------------------------------------
    files_pattern = os.path.join(inputDir, inputPattern)

    file_times = range(0, 101)

    filenames = [ (files_pattern % time) for time in file_times]

    # I want the last contour index to have all 10 contours, but before that I
    # want 10 individual contours one at a time.
    contourValues = [ [ 0.0 ],
                      [ 2111.111111111111 ],
                      [ 4222.222222222222 ],
                      [ 6333.333333333333 ],
                      [ 8444.444444444443 ],
                      [ 10555.555555555557 ],
                      [ 12666.666666666666 ],
                      [ 14777.777777777777 ],
                      [ 16888.888888888887 ],
                      [ 19000.0 ],
                      [  0.0, 2111.111111111111, 4222.222222222222, 6333.333333333333, 8444.444444444443,
                         10555.555555555557, 12666.666666666666, 14777.777777777777, 16888.888888888887, 19000.0  ] ]

    # -----------------------------------------------------------------------------
    # Rendering configuration
    # -----------------------------------------------------------------------------

    resolution = 500
    view_size = [resolution, resolution]
    angle_steps = [15, 15]
    distance = 24632.991324377483
    rotation_axis = [0.0, 1.0, 0.0]
    center_of_rotation = [0.0, 0.0, 0.0]

    # One background color we can set on the view, as well in the cinema metadata
    backgroundColor = [0.0, 0.0, 0.0]

    view = GetRenderView()
    view.ViewSize = view_size
    view.Background = backgroundColor
    view.OrientationAxesVisibility = 0
    view.CenterAxesVisibility = 0

    # -----------------------------------------------------------------------------
    # Output configuration
    # -----------------------------------------------------------------------------
    fng = wx.FileNameGenerator(outputDir, '{time}/{contourIdx}/{theta}_{phi}.jpg')
    fng.add_meta_data("type", "parametric-image-stack")
    fng.add_meta_data("backgroundColor", backgroundColor)
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

    # create a new 'Contour'
    contour1 = Contour(Input=transform1)
    contour1.ContourBy = ['POINTS', 'pressure']
    contour1.ComputeScalars = 1
    contour1.Isosurfaces = contourValues[0]
    contour1.PointMergeMethod = 'Uniform Binning'

    # get color transfer function/color map for 'pressure'
    pressureLUT = GetColorTransferFunction('pressure')
    pressureLUT.RGBPoints = [0.0, 0.0, 0.0, 1.0, 19000.000000000007, 1.0, 0.0, 0.0]
    pressureLUT.ColorSpace = 'HSV'
    pressureLUT.NanColor = [0.498039, 0.498039, 0.498039]
    pressureLUT.ScalarRangeInitialized = 1.0

    # show data from fine_results_
    readerDisplay = Show(transform1)
    readerDisplay.ColorArrayName = [None, '']
    readerDisplay.Opacity = 0.2
    readerDisplay.ScalarOpacityUnitDistance = 158

    # show data from contour1
    contour1Display = Show(contour1)
    contour1Display.ColorArrayName = ['POINTS', 'pressure']
    contour1Display.LookupTable = pressureLUT

    # -----------------------------------------------------------------------------
    # Batch processing
    # -----------------------------------------------------------------------------

    Render()

    for t in range(0, len(file_times), 1):
        time = file_times[t]
        GetAnimationScene().TimeKeeper.Time = float(time)
        UpdatePipeline(time)

        print "Moving to timestep ",time

        for idx in xrange(len(contourValues)):
            contour1.Isosurfaces = contourValues[idx]

            fng.update_active_arguments(contourIdx=idx)
            fng.update_label_arguments(contourIdx="Idx")
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

    args = parser.parse_args()

    doProcessing(args.inputdir, args.inputpattern, args.outputdir)
