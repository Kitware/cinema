

###
### This script can be run with pvpython rather than pvbatch, as it does not
### need mpi.
###
### Purpose:
###
###     See the purpose description in the script "hacc_magnitude_halos.py", as
### this script does the exact same thing, but for the points density image data
### files.
###
### Input Files:
###
###    1) DataExploration/Output/Cosmology/data/run-1/halos-%d.vtu
###    2) DataExploration/Output/Cosmology/data/run-1/points-%d.vti
###
### Output Files:
###
###    A cinema dataset into: DataExploration/Output/Cosmology/halo_points_time_linear
###

import sys, os

from paraview.simple import *
from cinema_utilities import *
from paraview import data_exploration as wx

# Need this import in order to directly rescale transfer functions to data range
from vtkPVServerManagerRenderingPython import *

#import matplotlib.pyplot as plt

# -----------------------------------------------------------------------------
# Path to input/output data/directories
# -----------------------------------------------------------------------------

#path_root = '/Volumes/OLeary'
path_root = '/media/scott/CINEMA FAT'

data_base_path = os.path.join(path_root, 'DataExploration/Data/Cosmology/data/run-1')

halos_pattern = os.path.join(data_base_path, 'halos-%d.vtu')
points_pattern = os.path.join(data_base_path, 'points-%d.vti')
file_times = range(0, 451, 50)
halos_filenames = [ (halos_pattern % time) for time in file_times]
points_filenames = [ (points_pattern % time) for time in file_times]

resolution = 500
output_working_dir = os.path.join(path_root, 'DataExploration/Output/Cosmology/points_halos_tent')

# -----------------------------------------------------------------------------
# Helper methods
# -----------------------------------------------------------------------------

def buildLookupTables(luts):
    for key in luts:
        dataRange = luts[key]["range"]
        if key == 'SplatterValues':
            luts[key]["lut"] = GetLookupTableForArray( key,
                                                       1,
                                                       RGBPoints = [0.0, 0.368627, 0.309804, 0.635294, 0.09999996033819177, 0.196078, 0.533333, 0.741176, 0.19999992067638353, 0.4, 0.760784, 0.647059, 0.29999988101457525, 0.670588, 0.866667, 0.643137, 0.39999984135276706, 0.901961, 0.960784, 0.596078, 0.4999998016909588, 1.0, 1.0, 0.74902, 0.5999997620291505, 0.996078, 0.878431, 0.545098, 0.6999997223673423, 0.992157, 0.682353, 0.380392, 0.7999996827055341, 0.956863, 0.427451, 0.262745, 0.8999996430437259, 0.835294, 0.243137, 0.309804, 0.9999916033850905, 0.619608, 0.00392157, 0.258824],
                                                       NanColor = [0.500008, 0.0, 0.0],
                                                       ColorSpace='RGB',
                                                       ScalarRangeInitialized=1.0)
        else:
            luts[key]["lut"] = GetLookupTableForArray( key, 1, RGBPoints=[dataRange[0], 0.231373, 0.298039, 0.752941, (dataRange[0]+dataRange[1])/2, 0.865003, 0.865003, 0.865003, dataRange[1], 0.705882, 0.0156863, 0.14902], VectorMode='Magnitude', NanColor=[0.0, 0.0, 0.0], ColorSpace='Diverging', ScalarRangeInitialized=1.0, LockScalarRange=1)


def createHatFunctions():
    baseWidth = 0.1
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

# -----------------------------------------------------------------------------
# Rendering configuration
# -----------------------------------------------------------------------------

view_size = [resolution, resolution]
#angle_steps = [15, 15]
angle_steps = [90, 90]
distance = 470
rotation_axis = [0.0, 1.0, 0.0]
center_of_rotation = [63.999996185675, 63.99996185355, 64.000034331975]

view = GetRenderView()
view.ViewSize = view_size
view.Background = [1.0, 1.0, 1.0]
view.OrientationAxesVisibility = 0
view.CenterAxesVisibility = 0

halos_array = ['on', 'off']
volume_array = ['on', 'off']

# -----------------------------------------------------------------------------
# Output configuration
# -----------------------------------------------------------------------------

title       = "499-1 - Probe the Cosmic Structure of the Dark Universe"
description = """
              In the standard model of cosmology, dark energy and dark matter
              together account for 95 percent of the mass energy of the universe;
              however, their ultimate origin remains a mystery. The Argonne
              Leadership Computing Facility (ALCF) will allocate significant
              supercomputing resources towards unraveling one of the key
              puzzles-the nature of the dark energy causing the universe to
              accelerate its current expansion rate.
              """

analysis = wx.AnalysisManager(output_working_dir, title, description)

id = 'point-volume-halos-time'
title = 'Magnitude Volume + Halos/Time'
description = '''
              Show the magnitude density using volume visualization with glyphed halos.
              '''
analysis.register_analysis(id, title, description, '{time}/{halos}/{volume}/{volumeIdx}/{theta}_{phi}.jpg', "parametric-image-stack")
fng = analysis.get_file_name_generator(id)
exporter = wx.ThreeSixtyImageStackExporter(fng, view, center_of_rotation, distance, rotation_axis, angle_steps)
exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Pipeline configuration
# -----------------------------------------------------------------------------

# Volume
volume                          = XMLImageDataReader( PointArrayStatus=['SplatterValues'], FileName=points_filenames )
volume_rep                      = Show(volume)
volume_rep.Representation       = 'Volume'

outline = Outline(Input=volume)
outlineRep = Show(outline)
outlineRep.ColorArrayName = [None, '']
outlineRep.DiffuseColor = [0.0, 0.0, 0.0]
outlineRep.LineWidth = 1.0

halos_reader                    = XMLUnstructuredGridReader( FileName=halos_filenames )
glyph                           = Glyph(Input = halos_reader, GlyphType="Sphere", GlyphTransform="Transform2" )
glyph.Scalars                   = ['POINTS', 'magnitude']
glyph.ScaleFactor               = 0.004
glyph.ScaleMode                 = 'scalar'
glyph.GlyphMode                 = 'All Points'
glyph.GlyphType.ThetaResolution = 16
glyph.GlyphType.PhiResolution   = 16
glyph_rep                       = Show(glyph)
glyph_rep.Representation        = 'Surface'

luts = {
    "SplatterValues" : {
        "range": [0.0, 500.0],
        "colorBy": ('POINT_DATA', 'SplatterValues'),
        "pwfunc": []
    },
    "magnitude" : {
        "range": [25.0, 913.0],
        "colorBy": ('POINT_DATA', 'magnitude'),
        "pwfunc": []
    },
}
buildLookupTables(luts)

volume_rep.LookupTable    = luts['SplatterValues']["lut"]
volume_rep.ColorArrayName = luts['SplatterValues']["colorBy"]

glyph_rep.LookupTable    = luts['magnitude']["lut"]
glyph_rep.ColorArrayName = luts['magnitude']["colorBy"]

# -----------------------------------------------------------------------------
# Batch processing
# -----------------------------------------------------------------------------

hatFunctions = createHatFunctions()

analysis.begin()
Render()
for time in range(0, len(file_times), 1):
    GetAnimationScene().TimeKeeper.Time = float(time)
    UpdatePipeline(time)
    #vtkSMPVRepresentationProxy.RescaleTransferFunctionToDataRange(volume_rep.SMProxy)
    #vtkSMPVRepresentationProxy.RescaleTransferFunctionToDataRange(glyph_rep.SMProxy)
    #dataRange = getTotalPointDataRange(volume, "SplatterValues")
    dataRange = [0.0, 1.0]
    print "Moving to timestep ",time,", new data range: ",dataRange
    for halos in halos_array:
        if halos == 'on':
            glyph_rep.Visibility = 1
        else:
            glyph_rep.Visibility = 0
        fng.update_active_arguments(halos=halos)
        fng.update_label_arguments(halos="Halos")
        for vlome in volume_array:
            fng.update_active_arguments(volume=vlome)
            fng.update_label_arguments(volume="Volume")
            if vlome == 'on':
                volume_rep.Visibility = 1
                for volumeIdx in range(10):
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
                    volume_rep.ScalarOpacityFunction = newPwf
                    fng.update_active_arguments(volumeIdx=volumeIdx)
                    fng.update_label_arguments(volumeIdx="Idx")
                    exporter.UpdatePipeline(time)
            else:
                volume_rep.Visibility = 0
                for volumeIdx in range(10):
                    fng.update_active_arguments(volumeIdx=volumeIdx)
                    fng.update_label_arguments(volumeIdx="Idx")
                    exporter.UpdatePipeline(time)
analysis.end()
