
###
### This script demonstrates the use of the new generic cinema io api to create
### a small dataset based on the disk_out_ref Exodus II file.  Three contours
### are created and images are captured from a small set of camera angles.  Due
### to the fact that all the data array values are radially symmetric, we chose
### to color by cellNormals (y component), so that it is clear when rotating the
### the dataset in the cinema UI that images are indeed different at each value
### of phi.
###
### To use this script, follow the command example below, after changing the
### variable "outputDirectory" to a path that makes sense for your system.
###
### Below is an example command we have used to run this script.  We typically
### use pvpython so that the ParaView imports will be satisfied, then we prepend
### the PYTHONPATH so that the genericCinemaIO imports will be satisfied:
###
###     PYTHONPATH=/home/scott/projects/genericCinemaIO /home/scott/projects/ParaView/build-make-debug/bin/pvpython /home/scott/projects/cinema/scripts/data_generation/generateSimpleDiskOut.py
###

import os

# ParaView imports
from paraview.simple import *

# Cinema imports
from cinema_store import *
import pv_explorers


# -----------------------------------------------------------------------------
# Configure input/output
# -----------------------------------------------------------------------------

inputFile = '/home/scott/projects/ParaViewData/Data/disk_out_ref.ex2'
outputDirectory = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/tiny-diskout'

if not os.path.exists(outputDirectory):
    os.makedirs(outputDirectory)

# -----------------------------------------------------------------------------
# Customize a view
# -----------------------------------------------------------------------------
view = GetRenderView()
view.Background = [1.0, 1.0, 1.0]
view.OrientationAxesVisibility = 0
view.CenterAxesVisibility = 0

# -----------------------------------------------------------------------------
# Create some Cinema settings
# -----------------------------------------------------------------------------
resolution = 500
center_of_rotation = [0.0, 0.0, 0.0]
rotation_axis = [0.0, 0.0, 1.0]
distance = 45.0

phis = range(0, 360, 60)
thetas = range(-60, 61, 30)
iso_values = [ 300.0, 600.0, 900.0 ]

# -----------------------------------------------------------------------------
# Create a pipeline including an exodus reader and a Contour filter
# -----------------------------------------------------------------------------
disk_out_refex2 = ExodusIIReader(FileName=[inputFile])
disk_out_refex2.PointVariables = ['Temp', 'Pres', 'AsH3', 'GaMe3', 'CH4', 'H2']
disk_out_refex2.NodeSetArrayStatus = []
disk_out_refex2.SideSetArrayStatus = []
disk_out_refex2.ElementBlocks = ['Unnamed block ID: 1 Type: HEX8']

# get color transfer function/color map for 'cellNormals'
lut = GetColorTransferFunction('cellNormals')
lut.RGBPoints = [-0.9961946606636047, 0.231373, 0.298039, 0.752941, 0.0, 0.865003, 0.865003, 0.865003, 0.9961946606636047, 0.705882, 0.0156863, 0.14902]
lut.ScalarRangeInitialized = 1.0
lut.VectorComponent = 1
lut.VectorMode = 'Component'

pwf = GetOpacityTransferFunction('cellNormals')
pwf.Points = [-0.9961946606636047, 0.0, 0.5, 0.0, 0.9961946606636047, 1.0, 0.5, 0.0]
pwf.ScalarRangeInitialized = 1

contourFilter = Contour(
    Input=disk_out_refex2,
    PointMergeMethod="Uniform Binning",
    ContourBy = ['POINTS', 'Temp'],
    Isosurfaces = [300.0],
    ComputeScalars = 1)

representation                           = Show(contourFilter, view)
representation.ColorArrayName            = ['CELLS', 'cellNormals']
representation.LookupTable               = lut
representation.ColorArrayName            = colorByVariableName

# -----------------------------------------------------------------------------
# Configure Cinema data export settings
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
