
###
### This script will generate two simple Cinema datasets, they will be placed
### underneath /tmp/wavelet/.
###

from paraview.simple import *
from paraview.data_exploration import *

analysis = AnalysisManager(
    '/tmp/wavelet',                     # Work path
    "Wavelet exploration",              # Title
    "no-description")                   # Description

# Explore data via contours
analysis.register_analysis(
    "contour",                          # id
    "Contour exploration",              # title
    "Perform 10 contours",              # description
    "{iso}/{phi}_{theta}.jpg",          # data structure
    "parametric-image-stack")                  # viewer to use

# Explore data via slice
analysis.register_analysis(
    "slice",                            # id
    "Slice exploration",                # title
    "Perform 10 slice along X",         # description
    "{sliceColor}_{slicePosition}.jpg", # data structure
    "parametric-image-stack")                  # viewer to use

# Create exploration pipeline
data_to_explore = Wavelet()

analysis.begin()

# ========== Contour exploration settings ===============

min = 113
max = 250

view = GetRenderView()
view.Background = [1.0, 1.0, 1.0]
center_of_rotation = [0.0, 0.0, 0.0]
rotation_axis = [0.0, 0.0, 1.0]
angle_steps = (90, 90)
distance = 60
lut = GetLookupTableForArray(
    "RTData", 1,
    RGBPoints=[min, 0.23, 0.299, 0.754, (min+max)*0.5, 0.865, 0.865, 0.865, max, 0.706, 0.016, 0.15],
    ColorSpace='Diverging',
    ScalarRangeInitialized=1.0 )

iso_values = [ ((float(x) * (max-min) * 0.1) + min) for x in range(10)]
# iso_values = [ 100,150,200,250 ]

# Create contour pipeline
countourFilter = Contour(
    Input=data_to_explore,
    PointMergeMethod="Uniform Binning",
    ContourBy = ['POINTS', 'RTData'],
    Isosurfaces = [ (min+max)*.5 ],
    ComputeScalars = 1 )

representation                    = Show(countourFilter, view)
representation.LookupTable        = lut
representation.ColorArrayName     = "RTData"

# Configure exploration
fng = analysis.get_file_name_generator("contour")
exporter = ThreeSixtyImageStackExporter(fng, view, center_of_rotation, distance, rotation_axis, angle_steps)
exporter.set_analysis(analysis)

# Explore
for iso in iso_values:
    countourFilter.Isosurfaces = [ iso ]
    fng.update_active_arguments(iso=iso)
    fng.update_label_arguments(iso="Idx")
    exporter.UpdatePipeline()

# ========== Slice exploration settings ===============

nb_slices = 5
colorByArray = { "RTData": { "lut": lut , "type": 'POINT_DATA'} }
view = CreateRenderView()

view.Background = [1.0, 1.0, 1.0]

# Configure exploration
fng = analysis.get_file_name_generator("slice")
fng.update_label_arguments(slicePosition='slice')
exporter = SliceExplorer(fng, view, data_to_explore, colorByArray, nb_slices)
exporter.set_analysis(analysis)

# Explore
exporter.UpdatePipeline()

# ========================================================
analysis.end()
