

import sys, os

from paraview.simple import *
from paraview import data_exploration as wx

# -----------------------------------------------------------------------------
# Input data to process
# -----------------------------------------------------------------------------

# Set up paths to input and output
pathRoot = '/media/scott/CINEMA FAT/DataExploration'
dataBasePath = os.path.join(pathRoot, 'Data/MPAS/data')

outputWorkingDir = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/mpas-data/flat-n-resampled'
outputFilePattern = 'LON_LAT_NLAYER-primal_%d_0.vti'

# Create file name pattern for input files
flatFilePattern = 'flat_n_primal/LON_LAT_NLAYER-primal_%d_0.vtu'

### For testing debugging: Reduce number of timesteps
#flatFileTimes = range(50, 5151, 50)  # range(50, 5901, 50)
flatFileTimes = range(50, 5151, 1050)
#flatFileTimes = [ 1250 ]

# Make output directory if it does not exist
if not os.path.exists(outputWorkingDir):
    os.makedirs(outputWorkingDir)

# Loop over desired timesteps, doing image resampling and saving the results
# to vtk image data files.
for t in flatFileTimes:
    inputFile = os.path.join(dataBasePath, (flatFilePattern % t))
    outputFile = os.path.join(outputWorkingDir, (outputFilePattern % t))

    print "Converting ",inputFile," to ",outputFile

    # create a new 'XML Unstructured Grid Reader'
    flatReader = XMLUnstructuredGridReader(FileName=[inputFile])
    flatReader.CellArrayStatus = ['temperature', 'salinity', 'density', 'pressure']

    # create a new 'ImageResampling'
    imageResampler = ImageResampling(Input=flatReader)
    imageResampler.SamplingDimension = [500, 250, 30]
    imageResampler.UseInputBounds = 0
    imageResampler.CustomSamplingBounds = [-3.2, 3.2, -1.3, 1.5, -3.0, 0.0]

    writer = XMLImageDataWriter(Input=imageResampler, FileName=outputFile)
    writer.UpdatePipeline(t)
