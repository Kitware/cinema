import argparse
import os

if __name__ == "__main__":
    """
    This sequentially symlinks every top-level dataset in the golden dataset,
    starting with the workbench then moving to individual runs. Between each
    one, waits for user input before symlinking the next one. This is designed
    to make the manual testing process a little quicker.

    Example: python symlinkTestData.py ~/path/to/golden/workbench/root
    """
    parser = argparse.ArgumentParser(description='Symlink every dataset in the golden set for manual testing.')
    parser.add_argument('root', type=str, help='path to the golden dataset root dir')
    args = parser.parse_args()

    rootDir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    os.chdir(os.path.join(rootDir, 'web', 'dist'))
    print('Working dir: ' + os.getcwd())

    datasets = (
        '',
        'test-runs/data-composite',
        'test-runs/data-composite-light',
        'test-runs/data-image',
        'test-runs/data-webgl-2jpg',
        'test-runs/data-webgl-png',
        'test-runs/medicare-charts',
        'test-runs/wavelet-webgl-light'
    )

    for dataset in datasets:
        if os.path.exists('data'):
            os.unlink('data')
        path = os.path.join(args.root, dataset)
        print('Linking dataset: ' + path)
        os.symlink(path, 'data')
        raw_input('Waiting, press any key to move to the next dataset...')
    print('Finished all datasets.')
