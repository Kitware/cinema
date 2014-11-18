
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

import sys, os, argparse

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


def doProcessing(outputDir, timesteps):
    # -----------------------------------------------------------------------------
    # Configuration
    # -----------------------------------------------------------------------------

    data_to_process = {
        "T": {
            "scalarRange": [178, 312],
            "contours": [ 265, 275, 285, 295 ]
        }
    }

    #resolution = 500
    resolution = 500
    #phis = [ 90, 180 ]
    #thetas = [ 0.0 ]
    phis = [ float(r) for r in range(0, 360, 20)]
    thetas = [-80.0, -60.0, -30.0, 0.0, 30.0, 60.0, 80.0]
    distance = 450
    rotation_axis = [0.0, 0.0, 1.0]
    center_of_rotation = [0.0, 0.0, 0.0]

    # -----------------------------------------------------------------------------
    # Input data definition
    # -----------------------------------------------------------------------------

    #path_root = '/Volumes/OLeary'
    path_root = '/media/scott/CINEMA FAT'

    data_base_path = os.path.join(path_root, 'cam5')
    earth_core_path = os.path.join(data_base_path, 'earth-high.vtk')

    #output_working_dir = os.path.join(path_root, 'Output/MPAS/web-generated/mpas-composite')
    #output_working_dir = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/cam5/contour-webgl-light'
    output_working_dir = os.path.join(outputDir, 'contour-webgl-light')

    earth_file = os.path.join(data_base_path, 'earth.vtk')
    file_pattern = os.path.join(data_base_path, 'cam5earth_%d.vtk')
    #file_times = range(0, 13, 1)
    #file_times = [ 6 ]
    file_times = timesteps
    cam5_filenames = [ (file_pattern % int(time)) for time in file_times]

    # -----------------------------------------------------------------------------
    # Pipeline definition
    # -----------------------------------------------------------------------------

    cam5earth   = LegacyVTKReader(FileNames=cam5_filenames)

    earthvtk    = LegacyVTKReader(FileNames=[earth_file])
    extract_globe_surface = ExtractSurface( Input = earthvtk )
    surface_normals = GenerateSurfaceNormals( Input = extract_globe_surface )

    # Generate iso contours
    contours = {}
    for field in data_to_process:
        contours[field] = []
        for isoValue in data_to_process[field]['contours']:
            contours[field].append(Contour(Input = cam5earth,
                                           PointMergeMethod = "Uniform Binning",
                                           ContourBy = field,
                                           Isosurfaces = [isoValue],
                                           ComputeScalars = 1))

    # -----------------------------------------------------------------------------
    # Output configuration
    # -----------------------------------------------------------------------------

    title       = "Visualizations from Cam5 Data"
    description = """
                  Atmospheric Simulations
                  """

    analysis = wx.AnalysisManager( output_working_dir, title, description,
                                   author="Patrick O'Leary",
                                   code_name="cam5",
                                   code_version="N/A",
                                   cores=1)

    # -----------------------------------------------------------------------------
    # Pre-calculate ranges
    # -----------------------------------------------------------------------------

    globalRanges = {
        'T': [ 10000000, -10000000 ],
        'U': [ 10000000, -10000000 ],
        'V': [ 10000000, -10000000 ],
        'magnitude': [ 10000000, -10000000 ]
    }

    print 'Calculating data array ranges over time'
    for time in file_times:
        t = int(time)
        print '  timestep ',t
        cam5earth.UpdatePipeline(t)
        pdi = cam5earth.GetPointDataInformation()

        for key in globalRanges.keys():
            globalRanges[key] = updateGlobalRange(pdi.GetArray(key).GetRange(), globalRanges[key])

    print 'Discovered global ranges:'
    print globalRanges

    # -----------------------------------------------------------------------------
    # Composite generator
    # -----------------------------------------------------------------------------

    id = 'contours-lit'
    title = 'Lit 3D contours composite'
    description = '3D contour of temperature'
    analysis.register_analysis(id, title, description, '{time}/{theta}/{phi}/{filename}', wx.CompositeImageExporter.get_data_type())
    fng = analysis.get_file_name_generator(id)

    camera_handler = wx.ThreeSixtyCameraHandler(fng,
                                                None,
                                                phis,
                                                thetas,
                                                center_of_rotation,
                                                rotation_axis,
                                                distance)

    iso_color_array = [
        ('VALUE', 'T'),
        ('VALUE', 'U'),
        ('VALUE', 'V'),
        ('VALUE', 'magnitude'),
        ('VALUE', 'nX'),
        ('VALUE', 'nY'),
        ('VALUE', 'nZ')
    ]

    luts = {
        "T": ["point", "T", 0, globalRanges['T']],
        "U": ["point", "U", 0, globalRanges['U']],
        "V": ["point", "V", 0, globalRanges['V']],
        "magnitude": ["point", "magnitude", 0, globalRanges['magnitude']],
        "bottomDepth": ["point", "bottomDepth", 0, [-10277.0, 7170.0]],
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

    for t in file_times:
        time = int(t)
        GetAnimationScene().TimeKeeper.Time = float(time)
        fng.update_active_arguments(time=time)
        print 'Generating images for timestep ',time
        exporter.UpdatePipeline(time)

    analysis.end()


if __name__ == "__main__":
    description = "Python script to generate dynamic rendering data for cam5"

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("--tsteps", type=str, default="", help="Comma-separated list of time steps to process")
    parser.add_argument("--outdir", type=str, default="", help="Directory to write output")

    args = parser.parse_args()

    timesteps = args.tsteps.split(',')

    print 'You want to process the following timesteps: ',timesteps

    doProcessing(args.outdir, timesteps)
