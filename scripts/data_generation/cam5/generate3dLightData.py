
###
### Run this script with pvpython so python can find paraview imports.
###
### Purpose:
###
###     Generates a 3D cinema dataset with earth core, and isocontours of
### temperature.  This script generates value-rendered sprite images for
### doing compositing, lighting, and lookuptable.
###
### Input:
###
###     - DataExploration/Data/MPAS/data/earth-high.vtk
###     - DataExploration/Data/MPAS/data/xyz_n_primal/X_Y_Z_NLAYER-primal_%d_0.vtu
###
### Output:
###
###     - DataExploration/Output/MPAS/web-generated/mpas-composite
###

# -----------------------------------------------------------------------------
# ParaView Python - Path setup
# -----------------------------------------------------------------------------

import sys, os

from paraview.simple import *
from paraview import data_exploration as wx

LoadDistributedPlugin('RGBZView', ns=globals())

# -----------------------------------------------------------------------------
# Helper methods
# -----------------------------------------------------------------------------

def updateGlobalRange(nextRange, globalRange):
    newGlobal = [ globalRange[0], globalRange[1] ]

    if nextRange[0] < globalRange[0]:
        newGlobal[0] = nextRange[0]

    if nextRange[1] > globalRange[1]:
        newGlobal[1] = nextRange[1]

    return newGlobal

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

data_to_process = {
    "temperature": {
        "scalarRange": [5.0, 25.0],
        "contours": [5.0, 10.0, 15.0, 20.0, 25.0],
    }
}

#resolution = 500
resolution = 500
#phis = [ float(r) for r in range(0, 360, 90)]
#thetas = [ 0.0, 30.0 ]
phis = [ float(r) for r in range(0, 360, 20)]
thetas = [-80.0, -60.0, -30.0, 0.0, 30.0, 60.0, 80.0]
distance = 25000000.0

# -----------------------------------------------------------------------------
# Input data definition
# -----------------------------------------------------------------------------

#path_root = '/Volumes/OLeary'
path_root = '/media/scott/CINEMA FAT/DataExploration'

data_base_path = os.path.join(path_root, 'Data/MPAS/data')
earth_core_path = os.path.join(data_base_path, 'earth-high.vtk')

#output_working_dir = os.path.join(path_root, 'Output/MPAS/web-generated/mpas-composite')
output_working_dir = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/mpas-data/mpas-composite-light'

globe_file_pattern = 'xyz_n_primal/X_Y_Z_NLAYER-primal_%d_0.vtu'

# globe_file_times = range(50, 51, 50) # 1 timesteps
# globe_file_times = range(50, 101, 50) # 2 timesteps
# globe_file_times = range(50, 501, 50) # 10 timesteps
# globe_file_times = range(50, 5151, 500) # 10 timesteps for 100th steps
globe_file_times = range(50, 5151, 50) # all timesteps

deltaTimeStep = 10

globe_filenames = [ os.path.join(data_base_path, (globe_file_pattern % time)) for time in globe_file_times]

# -----------------------------------------------------------------------------
# Pipeline definition
# -----------------------------------------------------------------------------

# Globe Core
globe_core = LegacyVTKReader(FileNames=[earth_core_path])
extract_globe_surface = ExtractSurface( Input = globe_core )
surface_normals = GenerateSurfaceNormals( Input = extract_globe_surface )

# Data pipeline
globe_reader    = XMLUnstructuredGridReader(FileName = globe_filenames,
                                            CellArrayStatus = ['temperature', 'salinity', 'density', 'pressure'])
globe_threshold = Threshold(Input = globe_reader,
                            Scalars = ['CELLS', 'temperature'],
                            ThresholdRange = [-1000.0, 50.0])
data_to_points  = CellDatatoPointData(Input = globe_threshold)

# Generate iso contours
contours = {}
for field in data_to_process:
    contours[field] = []
    for isoValue in data_to_process[field]['contours']:
        contours[field].append(Contour(Input = data_to_points,
                                       PointMergeMethod = "Uniform Binning",
                                       ContourBy = field,
                                       Isosurfaces = [isoValue],
                                       ComputeScalars = 1))

# -----------------------------------------------------------------------------
# Output configuration
# -----------------------------------------------------------------------------

title       = "MPAS - World Ocean - 120km"
description = """
              The following data anaylisis tries to simulate the evolution
              of the ocean in terms of temperature and salinity distribution accross
              """

analysis = wx.AnalysisManager( output_working_dir, title, description,
                               author="Andy Bauer",
                               code_name="MPAS",
                               code_version="1.3 + Ben changes",
                               cores=1)

# -----------------------------------------------------------------------------
# Pre-calculate ranges
# -----------------------------------------------------------------------------

globalRanges = {
    'temperature': [ 10000000, -10000000 ],
    'salinity': [ 10000000, -10000000 ],
    'density': [ 10000000, -10000000 ],
    'pressure': [ 10000000, -10000000 ]
}

for t in range(0, len(globe_file_times), deltaTimeStep):
    print '  timestep ',t
    globe_threshold.UpdatePipeline(t)
    cdi = globe_threshold.GetCellDataInformation()
    #data_to_points.UpdatePipeline(t)
    #pdi = data_to_points.GetPointDataInformation()

    for key in globalRanges.keys():
        globalRanges[key] = updateGlobalRange(cdi.GetArray(key).GetRange(), globalRanges[key])
        #globalRanges[key] = updateGlobalRange(pdi.GetArray(key).GetRange(), globalRanges[key])

print 'Discovered global ranges:'
print globalRanges

# -----------------------------------------------------------------------------
# Composite generator
# -----------------------------------------------------------------------------

id = 'iso-composite-' + str(resolution)
title = '3D contours composite'
description = '3D contour of temperature and salinity'
analysis.register_analysis(id, title, description, '{time}/{theta}/{phi}/{filename}', wx.CompositeImageExporter.get_data_type())
fng = analysis.get_file_name_generator(id)

camera_handler = wx.ThreeSixtyCameraHandler(fng, None, phis, thetas, [0.0, 0.0, 0.0], [0.0, 0.0, 1.0], distance)

iso_color_array = [
    ('VALUE', 'temperature'),
    ('VALUE', 'salinity'),
    ('VALUE', 'pressure'),
    ('VALUE', 'density'),
    ('VALUE', 'nX'),
    ('VALUE', 'nY'),
    ('VALUE', 'nZ')
]

pdi = globe_core.GetPointDataInformation()
bottomDepthRange = pdi.GetArray('bottomDepth').GetRange()
print 'bottomDepth range:',bottomDepthRange

luts = {
    "temperature": ["point", "temperature", 0, globalRanges['temperature']],
    "salinity": ["point", "salinity", 0, globalRanges['salinity']],
    "pressure": ["point", "pressure", 0, globalRanges['pressure']],
    "density": ["point", "density", 0, globalRanges['density']],
    "bottomDepth": ["point", "bottomDepth", 0, bottomDepthRange],
    'nX': ['point', 'Normals', 0, (-1,1)],
    'nY': ['point', 'Normals', 1, (-1,1)],
    'nZ': ['point', 'Normals', 2, (-1,1)]
}

composite_list = [ surface_normals ]
composite_description = [{'name': 'Earth core'} ]
colors = [
    [
        ('VALUE', 'bottomDepth'),
        ('VALUE', 'nX'),
        ('VALUE', 'nY'),
        ('VALUE', 'nZ')
    ]
]

#composite_list = []
#composite_description = []
#colors = []

for field in contours:
    for iso in contours[field]:
        composite_description.append({'name': field[0] + "=" + str(iso.Isosurfaces[0]), 'parent': "Contour by %s" % field})
        composite_list.append(iso)
        colors.append(iso_color_array)

exporter = wx.CompositeImageExporter(fng,
                                     composite_list,
                                     colors,
                                     luts,
                                     camera_handler,
                                     [resolution,resolution],
                                     composite_description,
                                     format='png') #, 0, 0)

# Customize some view properties
exporter.view.Background = [1.0, 1.0, 1.0]
exporter.view.OrientationAxesVisibility = 0
exporter.view.CenterAxesVisibility = 0

exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Perform analysis
# -----------------------------------------------------------------------------
analysis.begin()

for time in range(0, len(globe_filenames), deltaTimeStep):
    GetAnimationScene().TimeKeeper.Time = float(time)
    fng.update_active_arguments(time=time)
    exporter.UpdatePipeline(time)

analysis.end()
