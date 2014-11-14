
###
### Run this script with pvpython so python can find paraview imports.
###
### Purpose:
###
###     This script generates flat earth images of the unstructured
### grid used in the simulation.  In contrast to the similarly named file in
### this directory, this script renders data rather than colors to the images
### so that they can be rendered in the browser using a lookup table.
###

# -----------------------------------------------------------------------------
# ParaView Python - Module imports
# -----------------------------------------------------------------------------

import sys, os

from paraview.simple import *
from paraview import data_exploration as wx


LoadDistributedPlugin('RGBZView', ns=globals())


# -----------------------------------------------------------------------------
# Input data to process
# -----------------------------------------------------------------------------

#path_root = '/Users/kitware/Desktop'
path_root = '/media/scott/CINEMA FAT/DataExploration'

data_base_path = os.path.join(path_root, 'Data/Cosmology/data')

output_working_dir = os.path.join(path_root, 'Output/Cosmology/point_thresholds_lut/')

# List of halo files to include
#halo_file_format = 'Data/Cosmology/data/run-1/halos-%d.vtu'
#halo_file_names = [ os.path.join(path_root, halo_file_format % i) for i in xrange(0, 451, 50) ]

# List of point density files to include
# Data/Cosmology/data/analysis/raw-particles
file_times = range(0, 451, 50)
points_file_format = 'Data/Cosmology/data/analysis/raw-particles/499-%d.vtu'
points_file_names = [ os.path.join(path_root, points_file_format % i) for i in file_times ]

# -----------------------------------------------------------------------------
# Output configuration
# -----------------------------------------------------------------------------

title       = "499-2 - Probe the Cosmic Structure of the Dark Universe"
description = """
              In the standard model of cosmology, dark energy and dark matter
              together account for 95 percent of the mass energy of the universe;
              however, their ultimate origin remains a mystery. The Argonne
              Leadership Computing Facility (ALCF) will allocate significant
              supercomputing resources towards unraveling one of the key
              puzzles-the nature of the dark energy causing the universe to
              accelerate its current expansion rate.
              """

analysis = wx.AnalysisManager( output_working_dir, title, description,
                               author="Salman Habib and Katrin Heitmann",
                               code_name="HACC",
                               code_version="HACC 0.1",
                               cores=128)

id = 'point_thresholds'
title = 'Dynamic Rendering of Thresholded Points'
description = '''
              Show Threshold Densities and Halos.
              '''

### The following line (in tandem with the line "fng.update_active_arguments(slice=layer)"),
### causes the UI not to show the layer/slice manipulation widget in the current
### version of Cinema.  It seems that if you use the word "layer" as an argument,
### the UI won't show it.   So I changed "layer" to "slice", and it allows the
### UI to be properly generated.  The same thing seems to go for "field", so I
### had to change that to something else, I chose "colorby".
###
### Note that you can still have the labels in the UI show up however you want,
### you just need to use the file name generator "update_label_arguments" method
### to set the label each time the argument changes.

#analysis.register_analysis(id, title, description, '{time}/{field}/{layer}.jpg', 'parametric-image-stack')
analysis.register_analysis(id, title, description, '{time}/{theta}/{phi}/{filename}', 'composite-image-stack-lutdepth')
fng = analysis.get_file_name_generator(id)

# -----------------------------------------------------------------------------
# Pipeline configuration
# -----------------------------------------------------------------------------

#halos_reader                    = XMLUnstructuredGridReader( FileName=halo_file_names )
#glyph                           = Glyph(Input = halos_reader, GlyphType="Sphere", GlyphTransform="Transform2" )
#glyph.Scalars                   = ['POINTS', 'magnitude']
#glyph.ScaleFactor               = 0.005
#glyph.ScaleMode                 = 'scalar'
#glyph.GlyphMode                 = 'All Points'
#glyph.GlyphType.ThetaResolution = 16
#glyph.GlyphType.PhiResolution   = 16

# Create reader for large halo particle files
point_reader = XMLUnstructuredGridReader( FileName=points_file_names )

outline = Outline(Input=point_reader)

# create a new 'Calculator'
calculator1  = Calculator(Input=point_reader)
calculator1.ResultArrayName = 'magnitude'
calculator1.Function = 'sqrt((vx*vx)+(vy*vy)+(vz*vz))'

# create some new 'Threshold' filters
#den1         = Threshold(Input = calculator1, Scalars=['POINTS', 'magnitude'], ThresholdRange=[900, 17000] )
den1         = Threshold(Input = calculator1, Scalars=['POINTS', 'magnitude'], ThresholdRange=[900, 3601] )
den2         = Threshold(Input = calculator1, Scalars=['POINTS', 'magnitude'], ThresholdRange=[700, 900] )
den3         = Threshold(Input = calculator1, Scalars=['POINTS', 'magnitude'], ThresholdRange=[500, 700] )
den4         = Threshold(Input = calculator1, Scalars=['POINTS', 'magnitude'], ThresholdRange=[300, 500] )
den5         = Threshold(Input = calculator1, Scalars=['POINTS', 'magnitude'], ThresholdRange=[100, 300] )


luts = {
    "magnitude": ["point", "magnitude", 0, [ 22.2203, 19253.8 ]]
}

filters = []
filters_description = []
color_by = []

color_type = [
    ('VALUE', "magnitude")
]

filters.append(outline)
color_by.append( [ ('SOLID_COLOR', [0.0,0.0,0.0]) ] )
filters_description.append( { 'name': 'Outline'})

filters.append(den1)
color_by.append(color_type)
filters_description.append( {'name': '[900, +]', 'parent':'Magnitude Thresholds'} )

filters.append(den2)
color_by.append(color_type)
filters_description.append( {'name': '[700, 900]', 'parent':'Magnitude Thresholds'} )

filters.append(den3)
color_by.append(color_type)
filters_description.append( {'name': '[500, 700]', 'parent':'Magnitude Thresholds'} )

filters.append(den4)
color_by.append(color_type)
filters_description.append( {'name': '[300, 500]', 'parent':'Magnitude Thresholds'} )

filters.append(den5)
color_by.append(color_type)
filters_description.append( {'name': '[100, 300]', 'parent':'Magnitude Thresholds'} )

# -----------------------------------------------------------------------------
# Rendering configuration
# -----------------------------------------------------------------------------

view_size = [500, 500]

distance = 420
rotation_axis = [0.0, 1.0, 0.0]
center_of_rotation = [64.69269952178001, 65.57341161370277, 65.48730944097042]

#phi_angles = [ 180.0, 270.0 ]
#theta_angles = [ -15.0, 15.0 ]
phi_angles = [ float(r) for r in range(0, 360, 15)]
theta_angles = [ -60.0, -45.0, -30.0, -15.0, 0, 15.0, 30.0, 45.0, 60.0 ]

camera_handler = wx.ThreeSixtyCameraHandler( fng,                # file name generator
                                             None,               # view
                                             phi_angles,         # phis
                                             theta_angles,       # thetas
                                             center_of_rotation, # center
                                             rotation_axis,      # axis
                                             distance)           # distance

exporter = wx.CompositeImageExporter(fng,
                                     filters,
                                     color_by,
                                     luts,
                                     camera_handler,
                                     view_size,
                                     filters_description,
                                     format='png')  # 0, 0)

exporter.view.Background = [ 1.0, 1.0, 1.0 ]
exporter.view.OrientationAxesVisibility = 0
exporter.view.CenterAxesVisibility = 0

# Customize the look of the cells mask
outlineRep = Show(outline, exporter.view)

outlineRep = Show(outline)
outlineRep.ColorArrayName = [None, '']
outlineRep.DiffuseColor = [0.0, 0.0, 0.0]
outlineRep.LineWidth = 1.0


exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Batch processing
# -----------------------------------------------------------------------------

analysis.begin()

for time in range(len(file_times)):
    print "Working on timestep ",time

    fng.update_active_arguments(time=time)
    GetAnimationScene().TimeKeeper.Time = float(time)

    exporter.UpdatePipeline(time)

analysis.end()
