

###
### This script can be run with pvpython rather than pvbatch, as it does not
### need mpi.
###

import sys, os

from paraview.simple import *
from paraview import data_exploration as wx

# -----------------------------------------------------------------------------
# Path to input/output data/directories
# -----------------------------------------------------------------------------

#path_root = '/Volumes/OLeary'
path_root = '/media/scott/CINEMA FAT'

data_base_path = os.path.join(path_root, 'cam5')

earth_file = os.path.join(data_base_path, 'earth.vtk')
file_pattern = os.path.join(data_base_path, 'cam5earth_%d.vtk')
file_times = range(0, 13, 1)
#file_times = [ 6 ]
cam5_filenames = [ (file_pattern % time) for time in file_times]

resolution = 500
output_working_dir = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/cam5/volume_linear'

# -----------------------------------------------------------------------------
# Helper methods
# -----------------------------------------------------------------------------

def buildLookupTables(luts):
    for key in luts:
        if key == 'T':
            luts[key]["lut"] = GetLookupTableForArray( key,
                                                       1,
                                                       RGBPoints = [178.0, 0.368627, 0.309804, 0.635294, 191.4001072008576, 0.196078, 0.533333, 0.741176, 204.8002144017152, 0.4, 0.760784, 0.647059, 218.2003216025728, 0.670588, 0.866667, 0.643137, 231.60042880343042, 0.901961, 0.960784, 0.596078, 245.00053600428805, 1.0, 1.0, 0.74902, 258.4006432051456, 0.996078, 0.878431, 0.545098, 271.80075040600326, 0.992157, 0.682353, 0.380392, 285.20085760686084, 0.956863, 0.427451, 0.262745, 298.60096480771847, 0.835294, 0.243137, 0.309804, 312.0, 0.619608, 0.00392157, 0.258824],
                                                       NanColor = [0.500008, 0.0, 0.0],
                                                       ColorSpace='RGB',
                                                       ScalarRangeInitialized=1.0,
                                                       LockScalarRange=1)
        elif key == 'bottomDepth':
            luts[key]["lut"] = GetLookupTableForArray( key,
                                                       1,
                                                       RGBPoints=[-10277.0, 0.392157, 0.392157, 0.392157, -4481.664903999999, 0.392157, 0.392157, 0.392157, -50.00477499999943, 0.141176, 0.345098, 0.478431, 0.015773999999510124, 0.501961, 0.694118, 0.172549, 499.99445299999934, 0.74902, 0.560784, 0.188235, 3499.9886559999995, 0.752941, 0.741176, 0.729412, 7049.249313, 0.796078, 0.780392, 0.772549, 7170.0, 0.796078, 0.780392, 0.772549],
                                                       NanColor=[0.500008, 0.0, 0.0],
                                                       ColorSpace='RGB',
                                                       ScalarRangeInitialized=1.0,
                                                       LockScalarRange=1)

# -----------------------------------------------------------------------------
# Rendering configuration
# -----------------------------------------------------------------------------

view_size = [resolution, resolution]
angle_steps = [15, 15]
#angle_steps = [90, 90]
# 591.158 = math.sqrt(math.pow(83.915967, 2) + math.pow(232.971697, 2) + math.pow(536.795724, 2))
distance = 591.158
rotation_axis = [0.0, 0.0, 1.0]
center_of_rotation = [0.0, 0.0, 0.0]

view = GetRenderView()
view.ViewSize = view_size
view.Background = [1.0, 1.0, 1.0]
view.OrientationAxesVisibility = 0
view.CenterAxesVisibility = 0

# -----------------------------------------------------------------------------
# Output configuration
# -----------------------------------------------------------------------------

title       = "Visualizations from Cam5 Data"
description = """
              Atmospheric Simulations
              """

analysis = wx.AnalysisManager(output_working_dir, title, description)

id = 'cam5-volume-linear'
title = 'Temperature Volume Rendering'
description = '''
              Use a linear transfer function to volume render temperature data.
              '''
analysis.register_analysis(id, title, description, '{time}/{volumeIdx}/{theta}_{phi}.jpg', "parametric-image-stack")
fng = analysis.get_file_name_generator(id)
exporter = wx.ThreeSixtyImageStackExporter(fng, view, center_of_rotation, distance, rotation_axis, angle_steps)
exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Pipeline configuration
# -----------------------------------------------------------------------------

# create a new 'Legacy VTK Reader'
cam5earth                  = LegacyVTKReader(FileNames=cam5_filenames)
volume_rep                 = Show(cam5earth)
volume_rep.Representation  = 'Volume'

# create a new 'Legacy VTK Reader'
earthvtk = LegacyVTKReader(FileNames=[earth_file])
earth_rep = Show(earthvtk)

luts = {
    "T" : {
        "range": [178, 312],
        "colorBy": ('POINT_DATA', 'T'),
        "pwfunc": []
    },
    "bottomDepth" : {
        "range": [-10277.0, 7170.0],
        "colorBy": ('POINT_DATA', 'bottomDepth'),
        "pwfunc": []
    },
}

buildLookupTables(luts)

volume_rep.LookupTable    = luts['T']["lut"]
volume_rep.ColorArrayName = luts['T']["colorBy"]

earth_rep.LookupTable    = luts['bottomDepth']["lut"]
earth_rep.ColorArrayName = luts['bottomDepth']["colorBy"]

# -----------------------------------------------------------------------------
# Batch processing
# -----------------------------------------------------------------------------

analysis.begin()
Render()
for time in range(0, len(file_times), 1):
    GetAnimationScene().TimeKeeper.Time = float(time)
    UpdatePipeline(time)
    dataRange = [ 178, 312 ]
    print "Moving to timestep ",time
    for volumeIdx in range(10):
        curRange = dataRange[1] - dataRange[0]
        curStep = dataRange[0] + (float(volumeIdx) * (curRange / 10.0))
        newPwf = CreatePiecewiseFunction( Points=[dataRange[0], 0.0, 0.5, 0.0,
                                                  curStep,      0.0, 0.5, 0.0,
                                                  dataRange[1], 1.0, 0.5, 0.0] )
        volume_rep.ScalarOpacityFunction = newPwf
        fng.update_active_arguments(volumeIdx=volumeIdx)
        fng.update_label_arguments(volumeIdx="Idx")
        exporter.UpdatePipeline(time)

analysis.end()
