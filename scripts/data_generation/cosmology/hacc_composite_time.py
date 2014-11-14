
###
### This script can be run with pvpython rather than pvbatch, as it does not
### need mpi.
###
### Purpose:
###
###     Read all timesteps of the halos point files (vtu) which have fewer
### halo points and the raw-particles (vtu) which have many more halo points.
### For the few halo points, we create a glyph filter, scaling the glyph size
### and coloring by the magnitude density.  For the many halo points, we create
### 5 threshold filters, whose ranges are dynamically reset at each time step
### so that each threshold contains roughly the same number of points.  These
### thresholds are also colored by velocity magnitude, which we have to compute
### specifically in this case because the data files don't have that array to
### begin with.
###
### Input Files:
###
###    1) DataExploration/Output/Cosmology/data/run-1/halos-%d.vtu
###    2) DataExploration/Data/Cosmology/data/analysis/raw-particles/499-%d.vtu
###
### Output Files:
###
###    A cinema dataset into: DataExploration/Output/Cosmology/volume_time
###

import os, sys, math

from paraview.simple import *
from paraview import data_exploration as wx
from cinema_utilities import *

# Need this one to directly rescale transfer functions to data range
from vtkPVServerManagerRenderingPython import *

LoadDistributedPlugin('RGBZView', ns=globals())

# -----------------------------------------------------------------------------
# Helper methods
# -----------------------------------------------------------------------------

def buildSpectralLUT(name):
  return GetLookupTableForArray( name,
                                 1,
                                 RGBPoints = [0.0, 0.368627, 0.309804, 0.635294, 90.00072000576006, 0.196078, 0.533333, 0.741176, 180.00144001152012, 0.4, 0.760784, 0.647059, 270.0021600172801, 0.670588, 0.866667, 0.643137, 360.00288002304023, 0.901961, 0.960784, 0.596078, 450.00360002880024, 1.0, 1.0, 0.74902, 540.0043200345602, 0.996078, 0.878431, 0.545098, 630.0050400403203, 0.992157, 0.682353, 0.380392, 720.0057600460805, 0.956863, 0.427451, 0.262745, 810.0064800518404, 0.835294, 0.243137, 0.309804, 900.0, 0.619608, 0.00392157, 0.258824],
                                 NanColor = [0.500008, 0.0, 0.0],
                                 ColorSpace = 'RGB',
                                 ScalarRangeInitialized=1.0,
                                 LockScalarRange=0)

# -----------------------------------------------------------------------------
# Output configuration
# -----------------------------------------------------------------------------

path_root = '/media/scott/CINEMA FAT'
output_working_dir = os.path.join(path_root, 'DataExploration/Output/Cosmology/point_thresholds/')


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

# -----------------------------------------------------------------------------
# Image size, camera angles, and view information
# -----------------------------------------------------------------------------

resolution = 500
#phi_angles = [ float(r) for r in range(0, 360, 15)]
#theta_angles = [ -60.0, -45.0, -30.0, -15.0, 0, 15.0, 30.0, 45.0, 60.0 ]

# A small number of camera angles for when we're testing our pipeline and such
phi_angles = [ 180.0, 270.0 ]
theta_angles = [ 15.0, 45.0 ]

distance = 420
rotation_axis = [0.0, 1.0, 0.0]
center_of_rotation = [64.69269952178001, 65.57341161370277, 65.48730944097042]

# -----------------------------------------------------------------------------
# Set up lists of files to process
# -----------------------------------------------------------------------------

# List of halo files to include
halo_file_format = 'DataExploration/Data/Cosmology/data/run-1/halos-%d.vtu'
halo_file_names = [ os.path.join(path_root, halo_file_format % i) for i in xrange(0, 451, 50) ]

# List of point density files to include
# Data/Cosmology/data/analysis/raw-particles
points_file_format = 'DataExploration/Data/Cosmology/data/analysis/raw-particles/499-%d.vtu'
points_file_names = [ os.path.join(path_root, points_file_format % i) for i in xrange(0, 451, 50) ]

# -----------------------------------------------------------------------------
# Create data exploration
# -----------------------------------------------------------------------------

id = 'composite'
title = '3D composite'
description = "Show Threshold Densities and Halos."
analysis.register_analysis(id, title, description, '{time}/{theta}/{phi}/{filename}', wx.CompositeImageExporter.get_data_type())
fng = analysis.get_file_name_generator(id)

# -----------------------------------------------------------------------------
# Set up pipelines
# -----------------------------------------------------------------------------

halos_reader                    = XMLUnstructuredGridReader( FileName=halo_file_names )
glyph                           = Glyph(Input = halos_reader, GlyphType="Sphere", GlyphTransform="Transform2" )
glyph.Scalars                   = ['POINTS', 'magnitude']
glyph.ScaleFactor               = 0.005
glyph.ScaleMode                 = 'scalar'
glyph.GlyphMode                 = 'All Points'
glyph.GlyphType.ThetaResolution = 16
glyph.GlyphType.PhiResolution   = 16

# Create reader for large halo particle files
point_reader = XMLUnstructuredGridReader( FileName=points_file_names )

outline = Outline(Input=point_reader)
outlineRep = Show(outline)
outlineRep.ColorArrayName = [None, '']
outlineRep.DiffuseColor = [0.0, 0.0, 0.0]
outlineRep.LineWidth = 1.0

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

# -----------------------------------------------------------------------------
# Representations
# -----------------------------------------------------------------------------

###
### The second argument here is a View, but don't bother passing one in with
### your background color of choice set.  The View you pass in will get clobbered
### with a custom one.  Instead, use the camera handlers get_view() method to
### get your hands on the custom view created in the CompositeImageExporter, set
### your background color on that, then put it back using set_view().  See the
### "Customize view" section, below.
###
camera_handler = wx.ThreeSixtyCameraHandler(fng, None, phi_angles, theta_angles, center_of_rotation, rotation_axis, distance)

# Arguments: file_name_generator, view, focal_point, view_up, camera_position
#camera_handler = wx.FixCameraHandler(fng, None, [64.693, 65.573, 65.487], [0, 0, 1], [64.693, 65.573 + 420, 65.487] )

points_colors = [('POINT_DATA', 'magnitude')]

# These three arrays must be parallel to each other
composite_list        = [ outline, glyph, den1, den2, den3, den4, den5 ]
composite_description = [ {'name': 'Outline'}, {'name': 'Halos'}, {'name': '[900, +]', 'parent':'Magnitude Thresholds'}, {'name': '[700, 900]', 'parent':'Magnitude Thresholds'}, {'name': '[500, 700]', 'parent':'Magnitude Thresholds'}, {'name': '[300, 500]', 'parent':'Magnitude Thresholds'}, {'name': '[100, 300]', 'parent':'Magnitude Thresholds'} ]
composite_colors      = [ [('SOLID_COLOR', [0.0, 0.0, 0.0])], points_colors, points_colors, points_colors, points_colors, points_colors, points_colors ]

luts = {
    "magnitude" : buildSpectralLUT('magnitude')
}

# -----------------------------------------------------------------------------
# Data exploration
# -----------------------------------------------------------------------------

exporter = wx.CompositeImageExporter(fng,
                                     composite_list,
                                     composite_colors,
                                     luts,
                                     camera_handler,
                                     [resolution,resolution],
                                     composite_description,
                                     format='png') # 0, 0)
exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Custumize view and some representations
# -----------------------------------------------------------------------------

exporter.view.Background = [1.0, 1.0, 1.0]
exporter.view.OrientationAxesVisibility = 0
exporter.view.CenterAxesVisibility = 0

calculatorRepr = Show(calculator1, exporter.view)
den1Repr       = Show(den1, exporter.view)
den2Repr       = Show(den2, exporter.view)
den3Repr       = Show(den3, exporter.view)
den4Repr       = Show(den4, exporter.view)
den5Repr       = Show(den5, exporter.view)

# -----------------------------------------------------------------------------
# Processing
# -----------------------------------------------------------------------------

analysis.begin()

for time in range(0, len(halo_file_names), 1):
  GetAnimationScene().TimeKeeper.Time = float(time)
  fng.update_active_arguments(time=time)

  print "moving to timestep ",time

  # The point of these two lines is to allow the histogram filter to be
  # updated for the time step and then to reset the ranges on the thresholds
  # so that for this time step, each threshold contains roughly the same
  # number of points.
  UpdatePipeline(time)
  #eachTimePipelineChanges(time, histogram1, calculator1, [den1, den2, den3, den4, den5])

  # Now rescale the transfer function for the 'magnitude' array for the data
  # range of the current step.  You could argue this isn't what you'd want, but
  # it results in more colorful data
  #vtkSMPVRepresentationProxy.RescaleTransferFunctionToDataRange(calculatorRepr.SMProxy)
  vtkSMTransferFunctionProxy.RescaleTransferFunction(den1Repr.SMProxy, 0.0, 900.0, False)
  vtkSMTransferFunctionProxy.RescaleTransferFunction(den2Repr.SMProxy, 0.0, 900.0, False)
  vtkSMTransferFunctionProxy.RescaleTransferFunction(den3Repr.SMProxy, 0.0, 900.0, False)
  vtkSMTransferFunctionProxy.RescaleTransferFunction(den4Repr.SMProxy, 0.0, 900.0, False)
  vtkSMTransferFunctionProxy.RescaleTransferFunction(den5Repr.SMProxy, 0.0, 900.0, False)

  # Trigger the exporter to write out the next batch of images
  exporter.UpdatePipeline(time)

analysis.end()
