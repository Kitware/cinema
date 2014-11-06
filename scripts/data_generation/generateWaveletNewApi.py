
###
### This script demonstrates the use of the new generic cinema io api to create
### a small dataset based on the Wavelet source.  Several contours are created,
### and then images are saved from a set of camera angles.
###
### To use this script, follow the command example below, after changing the
### variable "outputDirectory" to a path that makes sense for your system.
###
### Below is an example command we have used to run this script.  We typically
### use pvpython so that the ParaView imports will be satisfied, then we prepend
### the PYTHONPATH so that the genericCinemaIO imports will be satisfied:
###
###     PYTHONPATH=/home/scott/projects/genericCinemaIO /home/scott/projects/ParaView/build-make-debug/bin/pvpython /home/scott/projects/cinema/scripts/data_generation/generateWaveletNewApi.py
###

import os

# ParaView imports
from paraview.simple import *

# Generic Cinema API imports
from cinema_store import *
import pv_explorers

# -----------------------------------------------------------------------------
# Configure output directory
# -----------------------------------------------------------------------------

outputDirectory = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/tiny-wavelet'

if not os.path.exists(outputDirectory):
    os.makedirs(outputDirectory)

# -----------------------------------------------------------------------------
# Contour exploration settings
# -----------------------------------------------------------------------------

min = 113.96153259277344
max = 250.22056579589844

# Configure some view properties
view = GetRenderView()
view.OrientationAxesVisibility = 0
view.CenterAxesVisibility = 0
view.Background = [1.0, 1.0, 1.0]
center_of_rotation = [0.0, 0.0, 0.0]
rotation_axis = [0.0, 0.0, 1.0]
angle_steps = (90, 90)
phis = range(0, 360, 60)
thetas = range(-60, 61, 30)
distance = 60

# Set up a simple lookup table for the RTData array
lut = GetLookupTableForArray(
    "RTData", 1,
    RGBPoints=[min, 0.23, 0.299, 0.754, (min+max)*0.5, 0.865, 0.865, 0.865, max, 0.706, 0.016, 0.15],
    ColorSpace='Diverging',
    ScalarRangeInitialized=1.0 )

# Create some contour values
iso_values = [ ((float(x) * (max-min) * 0.1) + min) for x in range(10)]

# Create the Wavelet source
data_to_explore = Wavelet()

# Add a contour filter to the pipeline
contourFilter = Contour(
    Input=data_to_explore,
    PointMergeMethod="Uniform Binning",
    ContourBy = ['POINTS', 'RTData'],
    Isosurfaces = [ (min+max)*.5 ],
    ComputeScalars = 1 )

representation                    = Show(contourFilter, view)
representation.LookupTable        = lut
representation.ColorArrayName     = "RTData"

# -----------------------------------------------------------------------------
# Configure Cinema data export
# -----------------------------------------------------------------------------

# This camera will take care of rotating around the object
cam = pv_explorers.Camera(center_of_rotation, rotation_axis, distance, view)

# Create the Cinema filestore
fng = FileStore(os.path.join(outputDirectory, 'info.json'))

# Configure the name pattern that governs how the images are placed into the
# directory hierarchy
fng.filename_pattern = "{iso}/{phi}/{theta}/image.png"

# Tell the filestore about the possible values for each parameter
fng.add_descriptor('iso', make_cinema_descriptor_properties('iso', range(len(iso_values))))
fng.add_descriptor('theta', make_cinema_descriptor_properties('theta', thetas))
fng.add_descriptor('phi', make_cinema_descriptor_properties('phi', phis))

# -----------------------------------------------------------------------------
# Data exploration loop
# -----------------------------------------------------------------------------

# Now do the exploration by manually iterating over all parameters
for iso in range(len(iso_values)):
    # Set the current contour value on the contour filter
    contourFilter.Isosurfaces = [ iso_values[iso] ]

    # Then capture an image from every configured camera angle
    for phi in phis:
        for theta in thetas:

            # Make an entry in the database and retrieve the filename for the
            # current set of parameter values
            doc = Document({'iso':iso,'phi':phi,'theta':theta})

            # Move the camera to the current location
            cam.execute(doc)

            # Get the filename, given the current parameter state
            fn = fng.get_filename(doc)
            fng.insert(doc)

            # Triggers the pipeline and then writes the resulting image
            WriteImage(fn)

# Generate metadata
fng.add_metadata({'type':'parametric-image-stack'})
fng.save()
